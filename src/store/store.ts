import type { ConnectionStatus, EditEvent } from '../stream/types.ts';

/**
 * A small external store for a high-frequency stream.
 *
 * Wikipedia produces dozens of changes per second. Re-rendering React for each one
 * would be wasteful, so incoming events are queued and applied in one batch per
 * flush interval. Every flush produces a new immutable snapshot, which is what
 * `useSyncExternalStore` needs to decide whether to re-render.
 */

export const SECONDS_TRACKED = 60;

export interface StreamState {
  /** Newest first, capped at `maxEvents`. Frozen while paused. */
  events: readonly EditEvent[];
  /** Events received while paused; shown after resume. */
  pending: readonly EditEvent[];
  paused: boolean;
  status: ConnectionStatus;
  total: number;
  byType: Readonly<Record<EditEvent['type'], number>>;
  byWiki: Readonly<Record<string, number>>;
  /** Event counts per second for the last SECONDS_TRACKED seconds, oldest first. */
  perSecond: readonly number[];
  /** Unix second that the last entry of `perSecond` belongs to. */
  lastSecond: number;
}

export interface StreamStore {
  getState(): StreamState;
  subscribe(listener: () => void): () => void;
  /** Queue an event; it becomes visible on the next flush. */
  push(event: EditEvent): void;
  /** Apply queued events now. Normally called by the flush timer. */
  flush(now?: number): void;
  setStatus(status: ConnectionStatus): void;
  setPaused(paused: boolean): void;
  start(): void;
  stop(): void;
}

export interface StoreOptions {
  maxEvents?: number;
  flushIntervalMs?: number;
  now?: () => number;
}

export function initialState(nowMs: number): StreamState {
  return {
    events: [],
    pending: [],
    paused: false,
    status: 'connecting',
    total: 0,
    byType: { edit: 0, new: 0, log: 0, categorize: 0 },
    byWiki: {},
    perSecond: new Array(SECONDS_TRACKED).fill(0),
    lastSecond: Math.floor(nowMs / 1000),
  };
}

/** Shift the per-second window forward to `second`, dropping buckets that fall out. */
export function advanceWindow(perSecond: readonly number[], lastSecond: number, second: number): number[] {
  const shift = second - lastSecond;
  if (shift <= 0) return perSecond.slice();
  if (shift >= perSecond.length) return new Array(perSecond.length).fill(0);
  return [...perSecond.slice(shift), ...new Array(shift).fill(0)];
}

export function createStreamStore(options: StoreOptions = {}): StreamStore {
  const maxEvents = options.maxEvents ?? 2000;
  const flushIntervalMs = options.flushIntervalMs ?? 250;
  const now = options.now ?? (() => Date.now());

  let state = initialState(now());
  let queue: EditEvent[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  function flush(nowMs = now()): void {
    const second = Math.floor(nowMs / 1000);
    const windowMoved = second !== state.lastSecond;
    if (queue.length === 0 && !windowMoved) return;

    const batch = queue;
    queue = [];

    const perSecond = advanceWindow(state.perSecond, state.lastSecond, second);
    const byType = { ...state.byType };
    const byWiki = { ...state.byWiki };
    for (const e of batch) {
      byType[e.type] += 1;
      byWiki[e.wiki] = (byWiki[e.wiki] ?? 0) + 1;
      // Bucket by arrival time: event timestamps have 1 s resolution and can lag.
      perSecond[perSecond.length - 1] += 1;
    }

    // The batch arrives oldest first; the table shows newest first.
    const newestFirst = batch.slice().reverse();
    let events = state.events;
    let pending = state.pending;
    if (state.paused) {
      pending = [...newestFirst, ...pending].slice(0, maxEvents);
    } else if (newestFirst.length > 0) {
      events = [...newestFirst, ...events].slice(0, maxEvents);
    }

    state = {
      ...state,
      events,
      pending,
      total: state.total + batch.length,
      byType,
      byWiki,
      perSecond,
      lastSecond: second,
    };
    emit();
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    push(event) {
      queue.push(event);
    },
    flush,
    setStatus(status) {
      if (status === state.status) return;
      state = { ...state, status };
      emit();
    },
    setPaused(paused) {
      if (paused === state.paused) return;
      flush();
      state = paused
        ? { ...state, paused: true }
        : {
            ...state,
            paused: false,
            events: [...state.pending, ...state.events].slice(0, maxEvents),
            pending: [],
          };
      emit();
    },
    start() {
      if (timer === null) timer = setInterval(() => flush(), flushIntervalMs);
    },
    stop() {
      if (timer !== null) clearInterval(timer);
      timer = null;
    },
  };
}
