import { useListQueryParams } from '@/pages/AppsDashboard/ItemsList/hooks/useListQueryParams';
import { useItemsListStore } from '@/pages/AppsDashboard/ItemsList/store/itemsListStore';

// True once a search or filter has returned nothing. False while loading, and for a workspace that is simply empty.
export function useHasNoMatches(): boolean {
  const status: string = useItemsListStore((state: { root: { status: string } }) => state.root.status);
  const itemCount: number = useItemsListStore((state: { root: { items: unknown[] } }) => state.root.items.length);
  const searchKey: string = useItemsListStore((state: { query: { searchKey: string } }) => state.query.searchKey);
  const { filters } = useListQueryParams();

  const hasActiveFilter = Object.values(filters).some((values) => values.length > 0);
  return status === 'success' && itemCount === 0 && (searchKey.trim() !== '' || hasActiveFilter);
}
