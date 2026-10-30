import { useStream, useStreamStore } from '../store/useStream.ts';
import type { ConnectionStatus } from '../stream/types.ts';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Connecting…',
  open: 'Live',
  reconnecting: 'Reconnecting…',
  closed: 'Disconnected',
};

export function Header() {
  const store = useStreamStore();
  const status = useStream((s) => s.status);
  const paused = useStream((s) => s.paused);
  const pending = useStream((s) => s.pending.length);
  const total = useStream((s) => s.total);

  return (
    <header className="header">
      <div className="brand">
        <h1>Wiki Pulse</h1>
        <p className="tagline">Every edit to every Wikipedia, as it happens.</p>
      </div>
      <div className="header__controls">
        <span className={`status status--${status}`} role="status" aria-live="polite">
          <span className="status__dot" aria-hidden="true" />
          {STATUS_LABEL[status]}
        </span>
        <span className="counter" title="Changes received since the page opened">
          {total.toLocaleString('en-US')} changes
        </span>
        <button
          type="button"
          className="button"
          aria-pressed={paused}
          onClick={() => store.setPaused(!paused)}
        >
          {paused ? `Resume (${pending.toLocaleString('en-US')} new)` : 'Pause'}
        </button>
      </div>
    </header>
  );
}
