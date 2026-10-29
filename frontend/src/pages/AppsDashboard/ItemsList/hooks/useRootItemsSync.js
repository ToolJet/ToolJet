import { useEffect, useMemo } from 'react';

import { useSearchStore } from '@/_stores/searchStore';
import { useItemsListStore } from '../store/itemsListStore';
import { useListQueryParams } from './useListQueryParams';

// Keeps the store's root page in sync with search, sort, filters and page. Shared by the list and grid views,
// which render the same data; only one of them is mounted at a time.
export function useRootItemsSync() {
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const query = useItemsListStore((state) => state.query);
  const setSearchKey = useItemsListStore((state) => state.setSearchKey);
  const fetchRootItems = useItemsListStore((state) => state.fetchRootItems);
  const { sort, filters } = useListQueryParams();

  useEffect(() => {
    setSearchKey(searchQuery);
  }, [searchQuery, setSearchKey]);

  const listParams = useMemo(() => ({ sort, ...filters }), [sort, filters]);

  useEffect(() => {
    fetchRootItems(listParams);
  }, [query, listParams, fetchRootItems]);

  return { listParams };
}
