import { createZustandStoreWithImmer } from '@/_stores/utils';

const initialState = {
  searchQuery: '',
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
  }),
  { storeName: 'Search store' }
);
