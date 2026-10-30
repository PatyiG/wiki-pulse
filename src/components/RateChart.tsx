import { useStream } from '../store/useStream.ts';
import { SECONDS_TRACKED } from '../store/store.ts';

const WIDTH = 300;
const HEIGHT = 90;

/** Changes per second over the last minute, as a plain SVG area chart. */
export function RateChart() {
  const perSecond = useStream((s) => s.perSecond);
  // The newest bucket is still filling, so leave it out of the chart.
  const complete = perSecond.slice(0, -1);
  const max = Math.max(1, ...complete);
  const latest = complete[complete.length - 1] ?? 0;
  const avg = complete.reduce((a, b) => a + b, 0) / Math.max(1, complete.length);

  const step = WIDTH / (SECONDS_TRACKED - 2);
  const points = complete.map((v, i) => `${(i * step).toFixed(1)},${(HEIGHT - (v / max) * HEIGHT).toFixed(1)}`);
  const area = `0,${HEIGHT} ${points.join(' ')} ${WIDTH},${HEIGHT}`;

  return (
    <section className="panel" aria-labelledby="rate-heading">
      <h2 id="rate-heading">Changes per second</h2>
      <p className="metric">
        <strong data-testid="rate-latest">{latest}</strong>
        <span className="muted"> now · avg {avg.toFixed(1)} over the last minute</span>
      </p>
      <svg
        className="chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Changes per second over the last minute, peak ${max}`}
      >
        <polygon className="chart__area" points={area} />
        <polyline className="chart__line" points={points.join(' ')} />
      </svg>
    </section>
  );
}
