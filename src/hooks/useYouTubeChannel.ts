import { useCallback, useEffect, useState } from 'react';
import { MUSIC_PLATFORM_CHANNELS } from '../data/initialData';
import { BroadcastVideo } from '../types/church';
import { safeYoutubeId } from '../utils/security';

export interface YouTubeLiveInfo {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  source: 'api' | 'channel_page' | 'fallback';
}

export interface YouTubeSyncedBroadcast extends BroadcastVideo {
  thumbnailUrl: string;
  watchUrl: string;
  publishedAt: string;
  fromYouTubeAutoSync: true;
}

export interface YouTubeChannelState {
  ok: boolean;
  channelId: string;
  channelTitle: string;
  syncedAt: string | null;
  live: YouTubeLiveInfo;
  videos: YouTubeSyncedBroadcast[];
}

const DEFAULT_STATE: YouTubeChannelState = {
  ok: false,
  channelId: 'UCFRiks_8zTRq8zcuUq0sjJw',
  channelTitle: 'Nova Jerusalém Sampaio',
  syncedAt: null,
  live: {
    isLive: false,
    videoId: null,
    title: null,
    watchUrl: MUSIC_PLATFORM_CHANNELS.youtubeChurchLiveUrl,
    embedUrl: MUSIC_PLATFORM_CHANNELS.youtubeChurchLiveEmbedUrl,
    thumbnailUrl: null,
    source: 'fallback',
  },
  videos: [],
};

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const MEMORY_FRESH_MS = 60 * 1000; // 1 minute

let sharedState: YouTubeChannelState = DEFAULT_STATE;
let lastFetchedAt = 0;
let inFlightPromise: Promise<YouTubeChannelState> | null = null;
const listeners = new Set<(state: YouTubeChannelState) => void>();

function notifyListeners(next: YouTubeChannelState) {
  sharedState = next;
  listeners.forEach((cb) => cb(next));
}

function sanitizeResponse(raw: unknown): YouTubeChannelState {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE;
  const obj = raw as Record<string, unknown>;
  const rawLive = (obj.live && typeof obj.live === 'object' ? obj.live : {}) as Record<string, unknown>;
  const liveVideoId = safeYoutubeId(typeof rawLive.videoId === 'string' ? rawLive.videoId : '');
  const isLive = Boolean(rawLive.isLive) && Boolean(liveVideoId);

  const live: YouTubeLiveInfo = {
    isLive,
    videoId: isLive ? liveVideoId : null,
    title: isLive && typeof rawLive.title === 'string' ? rawLive.title : null,
    watchUrl: isLive
      ? `https://www.youtube.com/watch?v=${liveVideoId}`
      : MUSIC_PLATFORM_CHANNELS.youtubeChurchLiveUrl,
    embedUrl: isLive
      ? `https://www.youtube.com/embed/${liveVideoId}?rel=0`
      : MUSIC_PLATFORM_CHANNELS.youtubeChurchLiveEmbedUrl,
    thumbnailUrl: isLive ? `https://i.ytimg.com/vi/${liveVideoId}/hqdefault.jpg` : null,
    source:
      rawLive.source === 'api' || rawLive.source === 'channel_page'
        ? rawLive.source
        : 'fallback',
  };

  const rawVideos = Array.isArray(obj.videos) ? obj.videos : [];
  const videos: YouTubeSyncedBroadcast[] = [];
  const seen = new Set<string>();

  for (const item of rawVideos) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const ytId = safeYoutubeId(typeof rec.youtubeId === 'string' ? rec.youtubeId : '');
    if (!ytId || seen.has(ytId)) continue;
    seen.add(ytId);

    videos.push({
      id: `yt-${ytId}`,
      youtubeId: ytId,
      title: typeof rec.title === 'string' && rec.title.trim() ? rec.title.trim() : 'Pregação Nova Jerusalém',
      preacher:
        typeof rec.preacher === 'string' && rec.preacher.trim()
          ? rec.preacher.trim()
          : 'Nova Jerusalém Sampaio',
      series:
        typeof rec.series === 'string' && rec.series.trim()
          ? rec.series.trim()
          : 'Cultos & Pregações',
      date:
        typeof rec.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rec.date)
          ? rec.date
          : new Date().toISOString().slice(0, 10),
      publishedAt: typeof rec.publishedAt === 'string' ? rec.publishedAt : '',
      duration: typeof rec.duration === 'string' && rec.duration ? rec.duration : 'YouTube',
      description:
        typeof rec.description === 'string' && rec.description.trim()
          ? rec.description.trim()
          : 'Mensagem publicada no canal oficial da Nova Jerusalém Sampaio.',
      isLive: Boolean(rec.isLive) || (isLive && ytId === liveVideoId),
      thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
      fromYouTubeAutoSync: true,
    });
  }

  return {
    ok: Boolean(obj.ok),
    channelId: typeof obj.channelId === 'string' ? obj.channelId : DEFAULT_STATE.channelId,
    channelTitle: typeof obj.channelTitle === 'string' ? obj.channelTitle : DEFAULT_STATE.channelTitle,
    syncedAt: typeof obj.syncedAt === 'string' ? obj.syncedAt : new Date().toISOString(),
    live,
    videos,
  };
}

async function loadYouTubeSync(force = false): Promise<YouTubeChannelState> {
  const now = Date.now();
  if (!force && lastFetchedAt > 0 && now - lastFetchedAt < MEMORY_FRESH_MS) {
    return sharedState;
  }
  if (inFlightPromise && !force) {
    return inFlightPromise;
  }

  const endpoint = force ? '/api/youtube?refresh=1' : '/api/youtube';
  const task = fetch(endpoint, { headers: { Accept: 'application/json' } })
    .then(async (res) => {
      if (!res.ok) throw new Error('Falha ao consultar canal do YouTube.');
      const json = await res.json();
      const sanitized = sanitizeResponse(json);
      lastFetchedAt = Date.now();
      notifyListeners(sanitized);
      return sanitized;
    })
    .catch(() => {
      lastFetchedAt = Date.now();
      return sharedState;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  inFlightPromise = task;
  return task;
}

export function useYouTubeChannel() {
  const [state, setState] = useState<YouTubeChannelState>(sharedState);
  const [loading, setLoading] = useState<boolean>(lastFetchedAt === 0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    listeners.add(setState);
    let mounted = true;

    loadYouTubeSync(false).finally(() => {
      if (mounted) setLoading(false);
    });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadYouTubeSync(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      listeners.delete(setState);
      window.clearInterval(intervalId);
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      return await loadYouTubeSync(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    ...state,
    loading,
    refreshing,
    refresh,
  };
}
