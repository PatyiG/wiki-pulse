import { createContext, useContext, useSyncExternalStore } from 'react';
import type { StreamState, StreamStore } from './store.ts';

export const StreamContext = createContext<StreamStore | null>(null);

export function useStreamStore(): StreamStore {
  const store = useContext(StreamContext);
  if (!store) throw new Error('useStreamStore must be used inside <StreamContext.Provider>');
  return store;
}

/**
 * Subscribes to one slice of the stream state. The component re-renders only
 * when the selected value changes identity, so pick stable slices
 * (e.g. `s => s.events`), not freshly built objects.
 */
export function useStream<T>(selector: (state: StreamState) => T): T {
  const store = useStreamStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
