import { immer } from 'zustand/middleware/immer';
import { create } from '@/_stores/utils';
import { orgConstantsV2Service } from '@/_services/organization_constants_v2.service';
import { insertPins, movePinnedId } from '../helpers/pinOrder';

export const ITEMS_PER_PAGE = 50;

const initialState = {
  // Environment, tab, sort and source are owned by the URL (see useConstantsListQueryParams), so only page and search live here.
  query: { page: 1, searchKey: '' },
  // `meta` is the API response without its items: { page, page_size, total, counts }.
  root: { items: [], meta: null, status: 'idle' },
  // TanStack RowSelectionState keyed by constant id.
  rowSelection: {},
  // Ordered constant ids per tab type. In memory only, so pins are lost on reload; keep every read and write behind
  // the pin actions so storage can back them later.
  pins: { Secret: [], Global: [] },
};

// Kept outside the store because immer freezes state and an AbortController must stay mutable.
let listRequest = null;
// The URL-owned filters of the last fetch, so a mutation can refetch the page the user is looking at.
let lastListParams = null;

export const useConstantsListStore = create(
  immer((set, get) => {
    const refetch = () => (lastListParams ? get().fetchList(lastListParams) : Promise.resolve());

    return {
      ...initialState,

      setSearch: (searchKey) => {
        set((state) => {
          state.query.searchKey = searchKey;
          state.query.page = 1;
          state.rowSelection = {};
        });
      },

      setPage: (page) => {
        set((state) => {
          state.query.page = page;
          state.rowSelection = {};
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

      removeItems: (ids) => {
        const removed = new Set(ids);
        set((state) => {
          const before = state.root.items.length;
          state.root.items = state.root.items.filter((item) => !removed.has(item.id));
          if (state.root.meta) state.root.meta.total -= before - state.root.items.length;
          ids.forEach((id) => delete state.rowSelection[id]);
          Object.keys(state.pins).forEach((type) => {
            state.pins[type] = state.pins[type].filter((id) => !removed.has(id));
          });
        });
      },

      // Pins only what is on the loaded page (a pin needs its row to find its slot), so ordering is per page.
      pinConstants: (type, ids, sort) => {
        const { items } = get().root;
        set((state) => {
          state.pins[type] = insertPins(state.pins[type], items, ids, sort);
        });
      },

      unpinConstants: (type, ids) => {
        const removed = new Set(ids);
        set((state) => {
          state.pins[type] = state.pins[type].filter((id) => !removed.has(id));
        });
      },

      // `toIndex` counts among the pins on the loaded page.
      movePin: (type, id, toIndex) => {
        const loadedIds = get().root.items.map((item) => item.id);
        set((state) => {
          state.pins[type] = movePinnedId(state.pins[type], loadedIds, id, toIndex);
        });
      },

      fetchList: async ({ environmentId, type, sort, source }) => {
        // Aborting the previous request guarantees a stale response never overwrites a newer one.
        listRequest?.abort();
        const controller = new AbortController();
        listRequest = controller;
        lastListParams = { environmentId, type, sort, source };

        set((state) => {
          state.root.status = 'loading';
        });

        try {
          const { page, searchKey } = get().query;
          const { items, ...meta } = await orgConstantsV2Service.list(
            { environmentId, type, sort, source, search: searchKey, page, perPage: ITEMS_PER_PAGE },
            { signal: controller.signal }
          );
          if (controller.signal.aborted) return;
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

      createConstant: async (body) => {
        const constant = await orgConstantsV2Service.create(body);
        await refetch();
        return constant;
      },

      updateConstant: async (id, body) => {
        const constant = await orgConstantsV2Service.update(id, body);
        await refetch();
        return constant;
      },

      bulkDeleteConstants: async (ids) => {
        const result = await orgConstantsV2Service.bulkDelete(ids);
        get().removeItems(result.deleted_ids);
        await refetch();
        // Deleting every row of the last page would otherwise leave the user on an empty page.
        const { query, root } = get();
        if (root.status === 'success' && root.items.length === 0 && query.page > 1) {
          get().setPage(query.page - 1);
          await refetch();
        }
        return result;
      },
    };
  })
);
