import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchYouTubeChannelSync } from './_youtubeSync.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
    return;
  }

  try {
    const reqUrl = new URL(req.url || '/api/youtube', 'http://localhost');
    const forceRefresh = reqUrl.searchParams.get('refresh') === '1';
    const payload = await fetchYouTubeChannelSync(forceRefresh);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      forceRefresh ? 'no-store' : 'public, s-maxage=120, stale-while-revalidate=300'
    );
    res.end(JSON.stringify(payload));
  } catch {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
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
      })
    );
  }
}
