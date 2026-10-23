import { createZustandStoreWithImmer } from '@/_stores/utils';
import { dashboardItemsService } from '../services/dashboardItemsService';

export const ITEMS_PER_PAGE = 50;
export const FOLDER_ITEMS_PER_PAGE = 20;

const initialState = {
  // Sort and filters are owned by the URL (see useListQueryParams), so only page and search live here.
  query: { page: 1, searchKey: '' },
  root: { items: [], meta: null, status: 'idle' },
  // TanStack ExpandedState keyed by row id (`folder:<id>`), so the table can be controlled from here.
  expanded: {},
  // Loaded children per folder id: { items, page, hasMore, status: 'loading' | 'loadingMore' | 'success' | 'error' }.
  folders: {},
  // TanStack RowSelectionState keyed by row id; shared by the root table and every folder table.
  rowSelection: {},
};

// Selection holds a single kind at a time, so the first key's prefix (`app:` / `folder:`) decides it.
export const getSelectedKind = (rowSelection) => Object.keys(rowSelection)[0]?.split(':')[0] ?? null;

// Kept outside the store because immer freezes state and an AbortController must stay mutable.
let rootItemsRequest = null;
const folderItemsRequests = new Map();

export const useItemsListStore = createZustandStoreWithImmer(
  (set, get) => ({
    ...initialState,

    setSearchKey: (searchKey) => {
      set((state) => {
        state.query.searchKey = searchKey;
        state.query.page = 1;
      });
    },

    setPage: (page) => {
      set((state) => {
        state.query.page = page;
      });
    },

    // Accepts a value or an updater function, matching TanStack's onExpandedChange.
    setExpanded: (updater) => {
      const expanded = typeof updater === 'function' ? updater(get().expanded) : updater;
      set((state) => {
        state.expanded = expanded;
      });
    },

    // Accepts a value or an updater function, matching TanStack's onRowSelectionChange.
    setRowSelection: (updater) => {
      const rowSelection = typeof updater === 'function' ? updater(get().rowSelection) : updater;
      set((state) => {
        state.rowSelection = rowSelection;
      });
    },

    clearSelection: () => {
      set((state) => {
        state.rowSelection = {};
      });
    },

    // Sort changes keep folders open (only order changes); filter/search changes collapse them.
    resetFolders: ({ collapse }) => {
      folderItemsRequests.forEach((controller) => controller.abort());
      folderItemsRequests.clear();
      set((state) => {
        state.folders = {};
        if (collapse) state.expanded = {};
      });
    },

    fetchRootItems: async ({ sort, releaseStatus, visibility }) => {
      // Aborting the previous request guarantees a stale response never overwrites a newer one.
      rootItemsRequest?.abort();
      const controller = new AbortController();
      rootItemsRequest = controller;

      set((state) => {
        state.root.status = 'loading';
      });

      try {
        const { items, meta } = await dashboardItemsService.getRootItems(
          { ...get().query, sort, releaseStatus, visibility, type: 'front-end', perPage: ITEMS_PER_PAGE },
          { signal: controller.signal }
        );
        set((state) => {
          state.root = { items, meta, status: 'success' };
        });
      } catch {
        if (controller.signal.aborted) return;
        set((state) => {
          state.root.status = 'error';
        });
      }
    },

    fetchFolderItems: async (folderId, { sort, releaseStatus, visibility }, { nextPage = false } = {}) => {
      const cached = get().folders[folderId];
      if (nextPage && (!cached?.hasMore || cached.status === 'loadingMore')) return;

      folderItemsRequests.get(folderId)?.abort();
      const controller = new AbortController();
      folderItemsRequests.set(folderId, controller);
      const page = nextPage ? cached.page + 1 : 1;

      set((state) => {
        if (nextPage) state.folders[folderId].status = 'loadingMore';
        else state.folders[folderId] = { items: [], page: 0, hasMore: false, status: 'loading' };
      });

      try {
        const { items, meta } = await dashboardItemsService.getFolderItems(
          folderId,
          {
            sort,
            releaseStatus,
            visibility,
            searchKey: get().query.searchKey,
            page,
            perPage: FOLDER_ITEMS_PER_PAGE,
          },
          { signal: controller.signal }
        );
        set((state) => {
          const folder = state.folders[folderId];
          folder.items.push(...items);
          folder.page = page;
          folder.hasMore = meta.has_more;
          folder.status = 'success';
        });
      } catch {
        if (controller.signal.aborted) return;
        set((state) => {
          state.folders[folderId].status = 'error';
        });
      } finally {
        if (folderItemsRequests.get(folderId) === controller) folderItemsRequests.delete(folderId);
      }
    },
  }),
  { storeName: 'Dashboard items list store' }
);
