import type { StreamStore } from '../store/store.ts';
import { parseChange } from './parse.ts';

export const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange';

/**
 * Connects the store to Wikimedia's public EventStreams feed.
 * EventSource reconnects on its own after network errors; we only mirror its
 * state into the store so the UI can show it. Returns a disconnect function.
 */
export function connectStream(store: StreamStore, url: string = STREAM_URL): () => void {
  const source = new EventSource(url);
  store.setStatus('connecting');

  source.onopen = () => store.setStatus('open');
  source.onerror = () => {
    store.setStatus(source.readyState === EventSource.CLOSED ? 'closed' : 'reconnecting');
  };
  source.onmessage = (message: MessageEvent<string>) => {
    const event = parseChange(message.data);
    if (event) store.push(event);
  };

  store.start();
  return () => {
    source.close();
    store.stop();
    store.setStatus('closed');
  };
}
