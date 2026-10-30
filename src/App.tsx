import { useMemo } from 'react';
import { EventTable } from './components/EventTable.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { Header } from './components/Header.tsx';
import { RateChart } from './components/RateChart.tsx';
import { TopWikis } from './components/TopWikis.tsx';
import { matches } from './filters/filters.ts';
import { useUrlFilters } from './filters/useUrlFilters.ts';
import { useStream } from './store/useStream.ts';

export function App() {
  const [filters, setFilters] = useUrlFilters();
  const events = useStream((s) => s.events);
  const visible = useMemo(() => events.filter((e) => matches(e, filters)), [events, filters]);

  return (
    <div className="layout">
      <Header />
      <main className="main">
        <section className="panel panel--wide" aria-label="Recent changes">
          <FilterBar filters={filters} onChange={setFilters} shown={visible.length} buffered={events.length} />
          <EventTable events={visible} />
        </section>
        <aside className="side">
          <RateChart />
          <TopWikis selected={filters.wiki} onSelect={(wiki) => setFilters({ wiki })} />
        </aside>
      </main>
    </div>
  );
}
