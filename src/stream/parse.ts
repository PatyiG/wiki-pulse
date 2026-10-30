import type { ChangeType, EditEvent } from './types.ts';

const TYPES: ReadonlySet<string> = new Set(['edit', 'new', 'log', 'categorize']);

interface RawChange {
  id?: number | string;
  meta?: { id?: string; uri?: string; dt?: string };
  wiki?: string;
  server_name?: string;
  title?: string;
  title_url?: string;
  user?: string;
  bot?: boolean;
  type?: string;
  length?: { old?: number; new?: number };
  timestamp?: number;
  comment?: string;
}

/**
 * Turns one SSE `data:` payload into an EditEvent.
 * Returns null for malformed payloads and for event types the dashboard ignores,
 * so a single bad message never breaks the stream.
 */
export function parseChange(data: string): EditEvent | null {
  let raw: RawChange;
  try {
    raw = JSON.parse(data) as RawChange;
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || !raw.wiki || !raw.title || !raw.type || !TYPES.has(raw.type)) {
    return null;
  }

  const oldLen = raw.length?.old;
  const newLen = raw.length?.new;
  const sizeDelta = typeof newLen === 'number' ? newLen - (typeof oldLen === 'number' ? oldLen : 0) : null;

  const time =
    typeof raw.timestamp === 'number'
      ? raw.timestamp * 1000
      : raw.meta?.dt
        ? Date.parse(raw.meta.dt)
        : Date.now();

  return {
    id: String(raw.meta?.id ?? raw.id ?? `${raw.wiki}:${raw.title}:${time}`),
    wiki: raw.wiki,
    server: raw.server_name ?? '',
    title: raw.title,
    url: raw.title_url ?? raw.meta?.uri ?? '',
    user: raw.user ?? '',
    bot: raw.bot === true,
    type: raw.type as ChangeType,
    sizeDelta,
    time,
    comment: raw.comment ?? '',
  };
}
