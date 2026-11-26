export const DEFAULT_YOUTUBE_CHANNEL_ID = 'UCFRiks_8zTRq8zcuUq0sjJw';

const CHANNEL_ID_RE = /^UC[a-zA-Z0-9_-]{22}$/;
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export interface YouTubeLiveStatus {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  source: 'api' | 'channel_page' | 'fallback';
}

export interface YouTubeSyncedVideo {
  id: string;
  youtubeId: string;
  title: string;
  preacher: string;
  series: string;
  date: string;
  publishedAt: string;
  duration: string;
  thumbnailUrl: string;
  description: string;
  watchUrl: string;
  isLive?: boolean;
}

export interface YouTubeSyncResponse {
  ok: boolean;
  channelId: string;
  channelTitle: string;
  syncedAt: string;
  live: YouTubeLiveStatus;
  videos: YouTubeSyncedVideo[];
}

interface CacheEntry {
  fetchedAt: number;
  expiresAt: number;
  payload: YouTubeSyncResponse;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const FORCE_REFRESH_COOLDOWN_MS = 15 * 1000; // 15 seconds minimum between upstream refreshes
let cachedResult: CacheEntry | null = null;

function resolveChannelId(): string {
  const fromEnv = (process.env.YOUTUBE_CHANNEL_ID || '').trim();
  if (CHANNEL_ID_RE.test(fromEnv)) {
    return fromEnv;
  }
  return DEFAULT_YOUTUBE_CHANNEL_ID;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_m, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function cleanText(raw: string, maxLen: number): string {
  const decoded = decodeHtmlEntities(raw).replace(/\s+/g, ' ').trim();
  if (decoded.length <= maxLen) return decoded;
  return `${decoded.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

function inferSeriesFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('ebd') || lower.includes('escola bíblica') || lower.includes('escola biblica')) {
    return 'EBD Digital';
  }
  if (lower.includes('renovo') || lower.includes('quinta')) {
    return 'Culto do Renovo';
  }
  if (lower.includes('celebração') || lower.includes('celebracao') || lower.includes('domingo')) {
    return 'Culto Dominical';
  }
  if (lower.includes('pastoral')) {
    return 'Culto Pastoral';
  }
  if (lower.includes('informativo')) {
    return 'Informativo NJ';
  }
  if (lower.includes('congresso') || lower.includes('conferência') || lower.includes('conferencia')) {
    return 'Eventos & Congressos';
  }
  return 'Cultos & Pregações';
}

function extractTagValue(block: string, tagName: string): string {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = block.match(re);
  return match ? match[1].trim() : '';
}

function parseYouTubeRssXml(xml: string, fallbackChannelName: string): {
  channelTitle: string;
  videos: YouTubeSyncedVideo[];
} {
  const feedHeader = xml.split('<entry>')[0] || '';
  const channelTitle = cleanText(extractTagValue(feedHeader, 'title'), 120) || fallbackChannelName;

  const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
  const videos: YouTubeSyncedVideo[] = [];
  const seenIds = new Set<string>();

  for (const entry of entryMatches) {
    const rawVideoId = extractTagValue(entry, 'yt:videoId').trim();
    if (!VIDEO_ID_RE.test(rawVideoId) || seenIds.has(rawVideoId)) continue;
    seenIds.add(rawVideoId);

    const title = cleanText(extractTagValue(entry, 'title'), 180) || 'Mensagem Nova Jerusalém';
    const publishedRaw = extractTagValue(entry, 'published').trim();
    const publishedDate = /^\d{4}-\d{2}-\d{2}/.test(publishedRaw)
      ? publishedRaw.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const authorBlock = extractTagValue(entry, 'author');
    const authorName = cleanText(extractTagValue(authorBlock, 'name'), 100) || channelTitle;

    const rawDescription = extractTagValue(entry, 'media:description');
    const description =
      cleanText(rawDescription, 240) ||
      `Transmissão publicada no canal oficial ${channelTitle}.`;

    videos.push({
      id: `yt-${rawVideoId}`,
      youtubeId: rawVideoId,
      title,
      preacher: authorName,
      series: inferSeriesFromTitle(title),
      date: publishedDate,
      publishedAt: publishedRaw || `${publishedDate}T00:00:00Z`,
      duration: 'YouTube',
      thumbnailUrl: `https://i.ytimg.com/vi/${rawVideoId}/hqdefault.jpg`,
      description,
      watchUrl: `https://www.youtube.com/watch?v=${rawVideoId}`,
    });

    if (videos.length >= 15) break;
  }

  return { channelTitle, videos };
}

async function detectLiveViaApi(channelId: string, apiKey: string): Promise<YouTubeLiveStatus | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('eventType', 'live');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(7000),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: { title?: string };
    }>;
  };

  const first = json.items?.[0];
  const videoId = first?.id?.videoId?.trim() || '';
  if (VIDEO_ID_RE.test(videoId)) {
    return {
      isLive: true,
      videoId,
      title: cleanText(first?.snippet?.title || 'Culto Ao Vivo — Nova Jerusalém Sampaio', 180),
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      source: 'api',
    };
  }

  return {
    isLive: false,
    videoId: null,
    title: null,
    watchUrl: `https://www.youtube.com/channel/${channelId}/live`,
    embedUrl: `https://www.youtube.com/embed/live_stream?channel=${channelId}`,
    thumbnailUrl: null,
    source: 'api',
  };
}

async function detectLiveViaChannelPage(channelId: string): Promise<YouTubeLiveStatus> {
  const fallback: YouTubeLiveStatus = {
    isLive: false,
    videoId: null,
    title: null,
    watchUrl: `https://www.youtube.com/channel/${channelId}/live`,
    embedUrl: `https://www.youtube.com/embed/live_stream?channel=${channelId}`,
    thumbnailUrl: null,
    source: 'fallback',
  };

  try {
    const response = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) return fallback;
    const html = await response.text();

    // Confirm active live broadcast via YouTube's liveBroadcastDetails marker AND canonical watch videoId
    const hasActiveLiveFlag = /"isLiveNow"\s*:\s*true/.test(html);
    const canonicalMatch = html.match(
      /<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/i
    );
    const videoId = canonicalMatch?.[1] || '';

    if (hasActiveLiveFlag && VIDEO_ID_RE.test(videoId)) {
      const metaTitleMatch =
        html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) ||
        html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
      const liveTitle = metaTitleMatch?.[1]
        ? cleanText(metaTitleMatch[1], 180)
        : 'Culto Ao Vivo — Nova Jerusalém Sampaio';

      return {
        isLive: true,
        videoId,
        title: liveTitle,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        source: 'channel_page',
      };
    }

    return { ...fallback, source: 'channel_page' };
  } catch {
    return fallback;
  }
}

export async function fetchYouTubeChannelSync(forceRefresh = false): Promise<YouTubeSyncResponse> {
  const now = Date.now();
  if (cachedResult) {
    const withinNormalTtl = !forceRefresh && cachedResult.expiresAt > now;
    const withinForceCooldown =
      forceRefresh && now - cachedResult.fetchedAt < FORCE_REFRESH_COOLDOWN_MS;
    if (withinNormalTtl || withinForceCooldown) {
      return cachedResult.payload;
    }
  }

  const channelId = resolveChannelId();
  const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();

  const rssPromise = fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'application/atom+xml, application/xml, text/xml' },
  })
    .then(async (res) => {
      if (!res.ok) return null;
      return res.text();
    })
    .catch(() => null);

  const livePromise = (async (): Promise<YouTubeLiveStatus> => {
    if (apiKey) {
      try {
        const apiLive = await detectLiveViaApi(channelId, apiKey);
        if (apiLive) return apiLive;
      } catch {
        // Fall back to channel live page check
      }
    }
    return detectLiveViaChannelPage(channelId);
  })();

  const [rssXml, live] = await Promise.all([rssPromise, livePromise]);

  let channelTitle = 'Nova Jerusalém Sampaio';
  let videos: YouTubeSyncedVideo[] = [];

  if (rssXml) {
    const parsed = parseYouTubeRssXml(rssXml, channelTitle);
    channelTitle = parsed.channelTitle;
    videos = parsed.videos;
  }

  if (live.isLive && live.videoId) {
    videos = videos.map((v) =>
      v.youtubeId === live.videoId ? { ...v, isLive: true } : v
    );
  }

  const payload: YouTubeSyncResponse = {
    ok: Boolean(rssXml) || live.source !== 'fallback',
    channelId,
    channelTitle,
    syncedAt: new Date().toISOString(),
    live,
    videos,
  };

  cachedResult = {
    fetchedAt: now,
    expiresAt: now + CACHE_TTL_MS,
    payload,
  };

  return payload;
}
