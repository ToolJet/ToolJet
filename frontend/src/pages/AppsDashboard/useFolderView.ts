import { useEffect, useMemo } from 'react';

import { useSearchStore } from '@/_stores/searchStore';
import { useListQueryParams } from '@/HomePage/ItemsList/hooks/useListQueryParams';
import { useItemsListStore } from '@/HomePage/ItemsList/store/itemsListStore';
import type { ListFooterMeta } from '@/HomePage/ItemsList/ListFooter';

import type { AppItem } from './dashboard.types';
import { toGridItems, type RootItem } from './toGridItems';

type ListParams = ReturnType<typeof useListQueryParams>;
type FetchParams = ListParams['filters'] & { sort: string };

interface FolderViewState {
  items: RootItem[];
  meta: ListFooterMeta | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface ItemsListState {
  query: { page: number; searchKey: string };
  root: { items: RootItem[]; status: 'idle' | 'loading' | 'success' | 'error' };
  folderView: FolderViewState;
  setSearchKey: (searchKey: string) => void;
  fetchRootItems: (params: FetchParams) => void;
  fetchFolderViewItems: (folderId: string, params: FetchParams) => void;
  resetFolderView: () => void;
}

export type FolderViewStatus = 'loading' | 'success' | 'error' | 'notFound';

// Resolves the folder from its name in the loaded root items and keeps its apps in sync with search and page.
export function useFolderView(folderName: string): { status: FolderViewStatus; apps: AppItem[] } {
  const searchQuery: string = useSearchStore((state: { searchQuery: string }) => state.searchQuery);
  const query = useItemsListStore((state: ItemsListState) => state.query);
  const rootItems: RootItem[] = useItemsListStore((state: ItemsListState) => state.root.items);
  const rootStatus = useItemsListStore((state: ItemsListState) => state.root.status);
  const folderView = useItemsListStore((state: ItemsListState) => state.folderView);
  const setSearchKey = useItemsListStore((state: ItemsListState) => state.setSearchKey);
  const fetchRootItems = useItemsListStore((state: ItemsListState) => state.fetchRootItems);
  const fetchFolderViewItems = useItemsListStore((state: ItemsListState) => state.fetchFolderViewItems);
  const resetFolderView = useItemsListStore((state: ItemsListState) => state.resetFolderView);
  const { sort, filters } = useListQueryParams();
  const listParams = useMemo(() => ({ sort, ...filters }), [sort, filters]);

  // Search is scoped to the folder, so it feeds the same store key the root view uses.
  useEffect(() => {
    setSearchKey(searchQuery);
  }, [searchQuery, setSearchKey]);

  // A refresh or shared link lands here without root items, which are the only source of the folder id.
  useEffect(() => {
    if (rootStatus === 'idle') fetchRootItems(listParams);
  }, [rootStatus, listParams, fetchRootItems]);

  const folderId = rootItems.find((item) => item.kind === 'folder' && item.name === folderName)?.id;

  useEffect(() => {
    if (folderId) fetchFolderViewItems(folderId, listParams);
  }, [folderId, query, listParams, fetchFolderViewItems]);

  useEffect(() => resetFolderView, [folderName, resetFolderView]);

  const apps = useMemo(() => toGridItems(folderView.items).apps, [folderView.items]);

  if (rootStatus === 'error' || folderView.status === 'error') return { status: 'error', apps };
  if (rootStatus === 'success' && !folderId) return { status: 'notFound', apps };
  if (!folderId || folderView.status !== 'success') return { status: 'loading', apps };
  return { status: 'success', apps };
}
