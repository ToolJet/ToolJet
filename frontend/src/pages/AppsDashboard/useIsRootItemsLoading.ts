import { useItemsListStore } from '@/HomePage/ItemsList/store/itemsListStore';

// `idle` counts as loading: the first fetch starts in an effect, after the first render.
export function useIsRootItemsLoading(): boolean {
  return useItemsListStore(
    (state: { root: { status: string } }) => state.root.status === 'idle' || state.root.status === 'loading'
  );
}
