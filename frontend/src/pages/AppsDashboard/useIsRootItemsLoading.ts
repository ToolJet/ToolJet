// List view only: the grid view reads `/v2/apps` through react-query (see `ItemsList/DECISIONS.md`).
import { useItemsListStore } from '@/pages/AppsDashboard/ItemsList/store/itemsListStore';

// `idle` counts as loading: the first fetch starts in an effect, after the first render.
export function useIsRootItemsLoading(): boolean {
  return useItemsListStore(
    (state: { root: { status: string } }) => state.root.status === 'idle' || state.root.status === 'loading'
  );
}
