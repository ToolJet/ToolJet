import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useSearchStore } from '@/_stores/searchStore';

// Wires the header search input to the search store, using the config the current page set
export function useHeaderSearch() {
  const { pathname } = useLocation();
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const setDebouncedSearchQuery = useSearchStore((state) => state.setDebouncedSearchQuery);
  const { placeholder, debounceMs } = useSearchStore((state) => state.searchConfig);

  // Typing again, clearing or leaving the page cancels the pending update through this cleanup
  useEffect(() => {
    if (debounceMs <= 0) return;

    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs, setDebouncedSearchQuery]);

  // A query typed on one page shouldn't filter the next one
  useEffect(() => {
    clearSearch();
  }, [pathname, clearSearch]);

  return { placeholder, value: searchQuery, onChange: setSearchQuery, onClear: clearSearch };
}
