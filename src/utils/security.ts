/**
 * Centralized input sanitization, URL allowlisting, and blueprint constraint helpers.
 * Synchronized with firebase-blueprint.json & firestore.rules.
 */

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const DOC_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  // Strip ASCII control characters except newline and tab
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

export function safeExternalUrl(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function safeHttpsOrRelativeMediaUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500 || trimmed.includes('..')) return '';
  if (
    /^\/uploads\/[a-zA-Z0-9_\-.]+$/.test(trimmed) ||
    /^\/assets\/[a-zA-Z0-9_\-./]+$/.test(trimmed) ||
    /^\/src\/assets\/[a-zA-Z0-9_\-./]+$/.test(trimmed)
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

export function safeSpotifyEmbedUrl(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'open.spotify.com' &&
      parsed.pathname.startsWith('/embed/')
    ) {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function safeYoutubeId(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;
  return '';
}

export function safeDateIso(raw?: string | null): string {
  if (raw && DATE_ISO_RE.test(raw.trim())) {
    return raw.trim();
  }
  return new Date().toISOString().slice(0, 10);
}

export function makeSafeDocId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'doc';
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 12);
  const id = `${cleanPrefix}-${Date.now()}-${rand}`;
  return DOC_ID_RE.test(id) ? id : `doc-${Date.now()}`;
}

export function isValidDocId(id: string): boolean {
  return DOC_ID_RE.test(id);
}
