import type { StoreApi, UseBoundStore } from 'zustand';
import { omitBy, isUndefined } from 'lodash';

import { createZustandStoreWithImmer } from '@/_stores/utils';

import type { ISearchConfig, ISearchStore, ISearchStoreInitialState, SearchStoreCreator } from './types/searchStore';

export const DEFAULT_SEARCH_CONFIG: ISearchConfig = {
  placeholder: 'Search',
  debounceMs: 300,
};

const initialState: ISearchStoreInitialState = {
  // What the user has typed; shown in the header input
  searchQuery: '',
  // searchQuery after the debounce delay; pages should prefer filtering based on this value
  debouncedSearchQuery: '',
  searchConfig: DEFAULT_SEARCH_CONFIG,
};

const createSearchStore: SearchStoreCreator = (set) => ({
  ...initialState,
  setSearchQuery: (query) => {
    set((state) => {
      state.searchQuery = query;
      // Without a delay there is nothing to wait for, so the debounced value follows immediately
      if (state.searchConfig.debounceMs <= 0) state.debouncedSearchQuery = query;
    });
  },
  setDebouncedSearchQuery: (query) => {
    set((state) => {
      state.debouncedSearchQuery = query;
    });
  },
  // Skips the debounce, so a page action can reset the search in one step
  clearSearch: () => {
    set((state) => {
      state.searchQuery = '';
      state.debouncedSearchQuery = '';
    });
  },
  // Pages customise the header search through `useHeaderSearchConfig`, not by calling these directly
  setSearchConfig: (config) => {
    set((state) => {
      // An omitted option arrives as undefined and would otherwise overwrite its default
      state.searchConfig = { ...DEFAULT_SEARCH_CONFIG, ...omitBy(config, isUndefined) };
      // A delay switched off mid-typing must not leave the debounced value behind
      if (state.searchConfig.debounceMs <= 0) state.debouncedSearchQuery = state.searchQuery;
    });
  },
  resetSearchConfig: () => {
    set((state) => {
      state.searchConfig = DEFAULT_SEARCH_CONFIG;
    });
  },
});

// For search bar in header
export const useSearchStore: UseBoundStore<StoreApi<ISearchStore>> = createZustandStoreWithImmer(createSearchStore, {
  storeName: 'Search store',
});
