import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import useDebounce from '@/_hooks/useDebounce';
import { useSearchStore } from '@/_stores/searchStore';

// Wires the header search input to the search store, using the config the current page set
export function useHeaderSearch() {
  const { pathname } = useLocation();
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const setDebouncedSearchQuery = useSearchStore((state) => state.setDebouncedSearchQuery);
  const { placeholder, debounceMs } = useSearchStore((state) => state.searchConfig);

  const settledQuery = useDebounce(searchQuery, debounceMs);

  // `clearSearch` resets the store at once but not `settledQuery`, so a clear followed by the same text typed again
  // finds `settledQuery` already equal to it and must still be handed over. Requiring a match also drops a pending
  // update that was typed over.
  useEffect(() => {
    if (debounceMs > 0 && settledQuery === searchQuery) setDebouncedSearchQuery(searchQuery);
  }, [settledQuery, searchQuery, debounceMs, setDebouncedSearchQuery]);

  // A query typed on one page shouldn't filter the next one
  useEffect(() => {
    clearSearch();
  }, [pathname, clearSearch]);

  return { placeholder, value: searchQuery, onChange: setSearchQuery, onClear: clearSearch };
}
