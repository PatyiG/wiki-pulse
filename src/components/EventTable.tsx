import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useRef } from 'react';
import type { EditEvent } from '../stream/types.ts';

const ROW_HEIGHT = 40;

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Only link to http(s) URLs: the URL comes from the stream, not from us. */
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

function SizeDelta({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">–</span>;
  const cls = value > 0 ? 'delta delta--plus' : value < 0 ? 'delta delta--minus' : 'delta';
  return <span className={cls}>{value > 0 ? `+${value}` : value}</span>;
}

interface RowProps {
  event: EditEvent;
  top: number;
  /** Stripe by data index, not DOM order: virtualized rows are recycled while scrolling. */
  alt: boolean;
  index: number;
}

const Row = memo(function Row({ event, top, alt, index }: RowProps) {
  const href = safeUrl(event.url);
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      className={alt ? 'row row--alt' : 'row'}
      style={{ transform: `translateY(${top}px)` }}
      data-testid="event-row"
    >
      <span role="cell" className="cell cell--time">{timeFormat.format(event.time)}</span>
      <span role="cell" className="cell cell--wiki">{event.wiki}</span>
      <span role="cell" className="cell cell--title" title={event.comment || event.title}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer noopener">{event.title}</a>
        ) : (
          event.title
        )}
      </span>
      <span role="cell" className="cell cell--user">
        {event.user}
        {event.bot && <span className="badge">bot</span>}
      </span>
      <span role="cell" className={`cell cell--type type--${event.type}`}>{event.type}</span>
      <span role="cell" className="cell cell--delta"><SizeDelta value={event.sizeDelta} /></span>
    </div>
  );
});

export function EventTable({ events }: { events: readonly EditEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    getItemKey: (index) => events[index].id,
  });

  return (
    <div className="table" role="table" aria-label="Recent changes" aria-rowcount={events.length}>
      <div role="rowgroup">
        <div role="row" className="row row--head">
          <span role="columnheader" className="cell cell--time">Time</span>
          <span role="columnheader" className="cell cell--wiki">Wiki</span>
          <span role="columnheader" className="cell cell--title">Page</span>
          <span role="columnheader" className="cell cell--user">User</span>
          <span role="columnheader" className="cell cell--type">Type</span>
          <span role="columnheader" className="cell cell--delta">Bytes</span>
        </div>
      </div>
      <div ref={scrollRef} className="table__body" role="rowgroup" data-testid="table-body">
        {events.length === 0 ? (
          <p className="empty">Waiting for changes that match the filters…</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => (
              <Row
                key={item.key}
                event={events[item.index]}
                top={item.start}
                alt={item.index % 2 === 1}
                index={item.index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
