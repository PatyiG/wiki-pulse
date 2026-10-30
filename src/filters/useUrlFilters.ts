import { useCallback, useEffect, useState } from 'react';
import { type Filters, filtersFromSearch, filtersToSearch } from './filters.ts';

/**
 * Keeps the filters in the query string, so a filtered view can be bookmarked
 * or shared. Uses replaceState: typing in the search box should not flood the
 * browser history.
 */
export function useUrlFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch(window.location.search));

  useEffect(() => {
    const onPop = () => setFilters(filtersFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const update = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const url = `${window.location.pathname}${filtersToSearch(next)}${window.location.hash}`;
      window.history.replaceState(null, '', url);
      return next;
    });
  }, []);

  return [filters, update];
}
