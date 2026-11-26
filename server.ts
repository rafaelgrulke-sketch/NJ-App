import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createServer as createViteServer } from 'vite';
import { fetchYouTubeChannelSync } from './api/_youtubeSync.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize Firebase Admin ONLY for cryptographic ID token verification (requires zero IAM)
function getFirebaseProjectId(): string | null {
  try {
    const configPath = path.resolve(ROOT_DIR, 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as { projectId?: string };
    if (!raw.projectId || raw.projectId === 'remixed-project-id') return null;
    return raw.projectId;
  } catch {
    return null;
  }
}

const firebaseProjectId = getFirebaseProjectId();
const adminApp = firebaseProjectId
  ? getApps().length
    ? getApp()
    : initializeApp({ projectId: firebaseProjectId })
  : null;
const adminAuth = adminApp ? getAuth(adminApp) : null;

const VIDEO_TYPES: Record<string, { ext: string; maxBytes: number }> = {
  'video/mp4': { ext: '.mp4', maxBytes: 100 * 1024 * 1024 },
  'video/webm': { ext: '.webm', maxBytes: 100 * 1024 * 1024 },
};

const IMAGE_TYPES: Record<string, { ext: string; maxBytes: number }> = {
  'image/png': { ext: '.png', maxBytes: 10 * 1024 * 1024 },
  'image/jpeg': { ext: '.jpg', maxBytes: 10 * 1024 * 1024 },
  'image/webp': { ext: '.webp', maxBytes: 10 * 1024 * 1024 },
};

// Sliding-window in-memory rate limiter for upload endpoints (15 uploads / 10 min per key)
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_MAX_REQUESTS = 15;
const uploadRateBuckets = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (uploadRateBuckets.get(key) || []).filter((t) => now - t < UPLOAD_WINDOW_MS);
  if (timestamps.length >= UPLOAD_MAX_REQUESTS) {
    uploadRateBuckets.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  uploadRateBuckets.set(key, timestamps);
  return false;
}

// Verify same-origin on state-changing API requests (defense-in-depth against cross-origin abuse)
function verifySameOrigin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const expectedHost = (
        (req.headers['x-forwarded-host'] as string | undefined) ||
        req.headers.host ||
        ''
      )
        .split(',')[0]
        .trim();
      if (expectedHost && originHost !== expectedHost) {
        res.status(403).json({ error: 'Origem não autorizada para envio de arquivos.' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'Cabeçalho Origin inválido.' });
      return;
    }
  }
  next();
}

// Cryptographically verify Firebase Auth ID token before accepting any upload bytes
async function requireVerifiedFirebaseUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!adminAuth) {
    res.status(503).json({
      error: 'Serviço de autenticação não inicializado no servidor.',
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Autenticação obrigatória. Faça login com sua conta Google autorizada para enviar arquivos.',
    });
    return;
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length > 4096) {
    res.status(401).json({ error: 'Token de autenticação inválido.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email_verified) {
      res.status(403).json({
        error: 'É necessário ter um e-mail verificado para enviar arquivos de mídia.',
      });
      return;
    }

    const clientIp =
      ((req.headers['x-forwarded-for'] as string | undefined) || req.socket.remoteAddress || 'unknown')
        .split(',')[0]
        .trim();

    if (isRateLimited(`uid:${decoded.uid}`) || isRateLimited(`ip:${clientIp}`)) {
      res.status(429).json({
        error: 'Muitos envios em curto intervalo. Aguarde alguns minutos antes de tentar novamente.',
      });
      return;
    }

    next();
  } catch {
    res.status(401).json({
      error: 'Sessão expirada ou inválida. Faça login novamente para enviar arquivos.',
    });
  }
}

function verifyMagicBytes(mime: string, header: Buffer): boolean {
  if (header.length < 12) return false;
  if (mime === 'image/png') {
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    );
  }
  if (mime === 'image/jpeg') {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }
  if (mime === 'image/webp') {
    return (
      header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (mime === 'video/mp4') {
    return header.subarray(4, 8).toString('ascii') === 'ftyp';
  }
  if (mime === 'video/webm') {
    return (
      header[0] === 0x1a &&
      header[1] === 0x45 &&
      header[2] === 0xdf &&
      header[3] === 0xa3
    );
  }
  return false;
}

function handleBinaryUpload(
  allowedMap: Record<string, { ext: string; maxBytes: number }>,
  prefix: 'video' | 'image'
): express.RequestHandler {
  return (req, res) => {
    const rawContentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const spec = allowedMap[rawContentType];
    if (!spec) {
      res.status(415).json({
        error:
          prefix === 'video'
            ? 'Formato de vídeo não suportado. Envie arquivos MP4 ou WebM.'
            : 'Formato de imagem não suportado. Envie arquivos PNG, JPG ou WebP.',
      });
      return;
    }

    const declaredLength = Number(req.headers['content-length'] || 0);
    if (Number.isFinite(declaredLength) && declaredLength > spec.maxBytes) {
      res.status(413).json({
        error:
          prefix === 'video'
            ? 'O vídeo excede o limite máximo de 100 MB.'
            : 'A imagem excede o limite máximo de 10 MB.',
      });
      return;
    }

    const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}${spec.ext}`;
    const targetPath = path.resolve(UPLOADS_DIR, fileName);

    // Strict directory confinement check with trailing path.sep
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Caminho de destino inválido.' });
      return;
    }

    const writeStream = fs.createWriteStream(targetPath, { flags: 'wx' });
    let totalBytes = 0;
    let firstChunks: Buffer[] = [];
    let magicVerified = false;
    let aborted = false;

    const cleanupAndRespond = (status: number, message: string) => {
      if (aborted) return;
      aborted = true;
      req.unpipe(writeStream);
      writeStream.destroy();
      fs.unlink(targetPath, () => undefined);
      if (!res.headersSent) {
        res.status(status).json({ error: message });
      }
    };

    req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      totalBytes += chunk.length;
      if (totalBytes > spec.maxBytes) {
        cleanupAndRespond(
          413,
          prefix === 'video'
            ? 'O vídeo excede o limite máximo de 100 MB.'
            : 'A imagem excede o limite máximo de 10 MB.'
        );
        return;
      }

      if (!magicVerified) {
        firstChunks.push(chunk);
        const combined = Buffer.concat(firstChunks);
        if (combined.length >= 12) {
          if (!verifyMagicBytes(rawContentType, combined)) {
            cleanupAndRespond(
              400,
              'O conteúdo do arquivo não corresponde ao formato informado. Verifique o arquivo e tente novamente.'
            );
            return;
          }
          magicVerified = true;
          firstChunks = [];
        }
      }

      if (!writeStream.write(chunk)) {
        req.pause();
        writeStream.once('drain', () => {
          if (!aborted) req.resume();
        });
      }
    });

    req.on('end', () => {
      if (aborted) return;
      if (totalBytes === 0) {
        cleanupAndRespond(400, 'Arquivo vazio.');
        return;
      }
      if (!magicVerified) {
        const combined = Buffer.concat(firstChunks);
        if (!verifyMagicBytes(rawContentType, combined)) {
          cleanupAndRespond(400, 'Arquivo inválido ou corrompido.');
          return;
        }
      }
      writeStream.end();
    });

    req.on('close', () => {
      if (!req.complete && !aborted) {
        cleanupAndRespond(499, 'Upload cancelado pelo cliente.');
      }
    });

    req.on('error', () => {
      cleanupAndRespond(500, 'Erro ao receber o arquivo enviado.');
    });

    writeStream.on('error', () => {
      cleanupAndRespond(500, 'Não foi possível salvar o arquivo no servidor.');
    });

    writeStream.on('finish', () => {
      if (aborted || res.headersSent) return;
      res.status(201).json({
        url: `/uploads/${fileName}`,
        size: totalBytes,
        mimeType: rawContentType,
      });
    });
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Baseline protective HTTP headers (iframe-compatible; omits X-Frame-Options)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/youtube', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const payload = await fetchYouTubeChannelSync(forceRefresh);
      res.setHeader(
        'Cache-Control',
        forceRefresh ? 'no-store' : 'public, s-maxage=120, stale-while-revalidate=300'
      );
      res.json(payload);
    } catch {
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: false,
        channelId: 'UCFRiks_8zTRq8zcuUq0sjJw',
        channelTitle: 'Nova Jerusalém Sampaio',
        syncedAt: new Date().toISOString(),
        live: {
          isLive: false,
          videoId: null,
          title: null,
          watchUrl: 'https://www.youtube.com/channel/UCFRiks_8zTRq8zcuUq0sjJw/live',
          embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCFRiks_8zTRq8zcuUq0sjJw',
          thumbnailUrl: null,
          source: 'fallback',
        },
        videos: [],
      });
    }
  });

  app.post(
    '/api/uploads/video',
    verifySameOrigin,
    requireVerifiedFirebaseUser,
    handleBinaryUpload(VIDEO_TYPES, 'video')
  );
  app.post(
    '/api/uploads/image',
    verifySameOrigin,
    requireVerifiedFirebaseUser,
    handleBinaryUpload(IMAGE_TYPES, 'image')
  );

  // Serve uploaded media with Range support for smooth HTML5 video playback
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      next();
    },
    express.static(UPLOADS_DIR, {
      acceptRanges: true,
      dotfiles: 'deny',
      etag: true,
      maxAge: '7d',
      fallthrough: false,
    })
  );

  // Clean 404 handler for missing /uploads files
  app.use('/uploads', (_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(404).json({ error: 'Arquivo de mídia não encontrado.' });
  });

  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: {
        middlewareMode: { server: httpServer },
        hmr: { server: httpServer },
        ws: { server: httpServer },
        watch: process.env.DISABLE_HMR === 'true' ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Nova Jerusalém Sampaio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
