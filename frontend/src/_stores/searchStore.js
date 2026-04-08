import { createZustandStoreWithImmer } from '@/_stores/utils';

const initialState = {
  searchQuery: '',
  clearSearchQuery: false,
};

// For search bar in header
export const useSearchStore = createZustandStoreWithImmer(
  (set) => ({
    ...initialState,
    setSearchQuery: (query) => {
      set((state) => {
        state.searchQuery = query;
      });
    },
    setClearSearchQuery: (clear) => {
      set((state) => {
        state.clearSearchQuery = clear;
        clear && (state.searchQuery = '');
      });
    },
  }),
  { storeName: 'Search store' }
);
