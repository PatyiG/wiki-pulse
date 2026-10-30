import type { BotFilter, Filters, TypeFilter } from '../filters/filters.ts';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  shown: number;
  buffered: number;
}

export function FilterBar({ filters, onChange, shown, buffered }: Props) {
  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="field field--grow">
        <span>Search</span>
        <input
          type="search"
          placeholder="Page title or user"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Wiki</span>
        <input
          type="text"
          placeholder="e.g. huwiki"
          value={filters.wiki}
          spellCheck={false}
          onChange={(e) => onChange({ wiki: e.target.value.trim() })}
        />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={filters.type} onChange={(e) => onChange({ type: e.target.value as TypeFilter })}>
          <option value="all">All</option>
          <option value="edit">Edits</option>
          <option value="new">New pages</option>
          <option value="log">Log entries</option>
        </select>
      </label>
      <label className="field">
        <span>Bots</span>
        <select value={filters.bots} onChange={(e) => onChange({ bots: e.target.value as BotFilter })}>
          <option value="exclude">Hide bots</option>
          <option value="include">Include bots</option>
          <option value="only">Only bots</option>
        </select>
      </label>
      <p className="filters__count" aria-live="polite">
        Showing <strong>{shown.toLocaleString('en-US')}</strong> of {buffered.toLocaleString('en-US')} recent changes
      </p>
    </form>
  );
}
