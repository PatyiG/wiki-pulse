import type { EditEvent } from '../stream/types.ts';

export type TypeFilter = 'all' | 'edit' | 'new' | 'log';
export type BotFilter = 'include' | 'exclude' | 'only';

export interface Filters {
  /** Database name such as `huwiki`; empty string means every wiki. */
  wiki: string;
  type: TypeFilter;
  bots: BotFilter;
  /** Case-insensitive search in title and user name. */
  q: string;
}

export const DEFAULT_FILTERS: Filters = { wiki: '', type: 'all', bots: 'exclude', q: '' };

const TYPE_VALUES: readonly TypeFilter[] = ['all', 'edit', 'new', 'log'];
const BOT_VALUES: readonly BotFilter[] = ['include', 'exclude', 'only'];

export function matches(event: EditEvent, f: Filters): boolean {
  if (f.wiki && event.wiki !== f.wiki) return false;
  if (f.type !== 'all' && event.type !== f.type) return false;
  if (f.bots === 'exclude' && event.bot) return false;
  if (f.bots === 'only' && !event.bot) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!event.title.toLowerCase().includes(q) && !event.user.toLowerCase().includes(q)) return false;
  }
  return true;
}

/** Reads filters from a query string, falling back to defaults for unknown values. */
export function filtersFromSearch(search: string): Filters {
  const p = new URLSearchParams(search);
  const type = p.get('type') as TypeFilter | null;
  const bots = p.get('bots') as BotFilter | null;
  return {
    wiki: (p.get('wiki') ?? '').trim(),
    type: type && TYPE_VALUES.includes(type) ? type : DEFAULT_FILTERS.type,
    bots: bots && BOT_VALUES.includes(bots) ? bots : DEFAULT_FILTERS.bots,
    q: p.get('q') ?? '',
  };
}

/** Writes only non-default values, so a clean URL means default filters. */
export function filtersToSearch(f: Filters): string {
  const p = new URLSearchParams();
  if (f.wiki) p.set('wiki', f.wiki);
  if (f.type !== DEFAULT_FILTERS.type) p.set('type', f.type);
  if (f.bots !== DEFAULT_FILTERS.bots) p.set('bots', f.bots);
  if (f.q) p.set('q', f.q);
  const s = p.toString();
  return s ? `?${s}` : '';
}
