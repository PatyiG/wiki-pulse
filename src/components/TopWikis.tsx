import { useMemo } from 'react';
import { useStream } from '../store/useStream.ts';

interface Props {
  selected: string;
  onSelect: (wiki: string) => void;
}

export function TopWikis({ selected, onSelect }: Props) {
  const byWiki = useStream((s) => s.byWiki);
  const top = useMemo(
    () =>
      Object.entries(byWiki)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    [byWiki],
  );
  const max = top[0]?.[1] ?? 1;

  return (
    <section className="panel" aria-labelledby="top-heading">
      <h2 id="top-heading">Most active wikis</h2>
      {top.length === 0 ? (
        <p className="muted">No data yet.</p>
      ) : (
        <ol className="bars">
          {top.map(([wiki, count]) => (
            <li key={wiki}>
              <button
                type="button"
                className={`bar${selected === wiki ? ' bar--active' : ''}`}
                aria-pressed={selected === wiki}
                onClick={() => onSelect(selected === wiki ? '' : wiki)}
              >
                <span className="bar__label">{wiki}</span>
                <span className="bar__track" aria-hidden="true">
                  <span className="bar__fill" style={{ width: `${(count / max) * 100}%` }} />
                </span>
                <span className="bar__value">{count.toLocaleString('en-US')}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="hint muted">Click a wiki to filter the table.</p>
    </section>
  );
}
