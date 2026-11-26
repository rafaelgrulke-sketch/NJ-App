import { auth } from '../firebase';
import { safeYoutubeId } from './security';

export interface MediaUploadResult {
  url: string;
  size: number;
  mimeType: string;
}

const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm']);
const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function isSafeMediaUrl(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500 || trimmed.includes('..')) return false;
  if (
    /^\/uploads\/[a-zA-Z0-9_\-.]+$/.test(trimmed) ||
    /^\/assets\/[a-zA-Z0-9_\-./]+$/.test(trimmed) ||
    /^\/src\/assets\/[a-zA-Z0-9_\-./]+$/.test(trimmed)
  ) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (safeYoutubeId(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const candidate = url.pathname.replace(/^\//, '').split('/')[0] || '';
      return safeYoutubeId(candidate);
    }
    if (host.endsWith('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return safeYoutubeId(v);
      const parts = url.pathname.split('/').filter(Boolean);
      const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return safeYoutubeId(parts[embedIdx + 1]);
      }
    }
  } catch {
    return '';
  }
  return '';
}

export function formatBytesPtBR(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadMediaFile(
  kind: 'video' | 'image',
  file: File,
  onProgress?: (percent: number) => void
): Promise<MediaUploadResult> {
  const allowed = kind === 'video' ? ALLOWED_VIDEO_MIMES : ALLOWED_IMAGE_MIMES;
  const maxBytes = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (!allowed.has(file.type)) {
    throw new Error(
      kind === 'video'
        ? 'Formato inválido. Selecione um vídeo MP4 ou WebM.'
        : 'Formato inválido. Selecione uma imagem PNG, JPG ou WebP.'
    );
  }

  if (file.size === 0) {
    throw new Error('O arquivo selecionado está vazio.');
  }

  if (file.size > maxBytes) {
    throw new Error(
      kind === 'video'
        ? 'O vídeo excede o limite de 100 MB.'
        : 'A imagem excede o limite de 10 MB.'
    );
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Faça login com sua conta Google autorizada antes de enviar arquivos.');
  }
  const idToken = await currentUser.getIdToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/uploads/${kind}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        const pct = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader('Content-Type') || '';
      if (xhr.status === 404 || xhr.status === 405 || !contentType.includes('application/json')) {
        reject(
          new Error(
            'Upload direto requer servidor ativo. Na hospedagem gratuita do Firebase Hosting, use a opção "Link externo" (URL HTTPS da arte ou link do YouTube).'
          )
        );
        return;
      }
      try {
        const payload = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300 && payload.url) {
          onProgress?.(100);
          resolve(payload as MediaUploadResult);
          return;
        }
        reject(new Error(payload.error || 'Falha ao enviar o arquivo para o servidor.'));
      } catch {
        reject(new Error('Resposta inesperada do servidor ao processar o envio.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erro de conexão com o servidor durante o envio.'));
    };

    xhr.send(file);
  });
}
