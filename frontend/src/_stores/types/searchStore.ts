import type { StateCreator } from 'zustand';

export interface ISearchConfig {
  placeholder: string;
  debounceMs: number;
}

export interface ISearchStore {
  /** What the user has typed; shown in the header input. */
  searchQuery: string;
  /** `searchQuery` after the debounce delay; pages filter by this one. */
  debouncedSearchQuery: string;
  searchConfig: ISearchConfig;
  setSearchQuery: (query: string) => void;
  setDebouncedSearchQuery: (query: string) => void;
  /** Resets both queries at once, skipping the debounce. */
  clearSearch: () => void;
  /** Options left undefined keep their defaults. */
  setSearchConfig: (config: Partial<ISearchConfig>) => void;
  resetSearchConfig: () => void;
}

export type ISearchStoreInitialState = Pick<ISearchStore, 'searchQuery' | 'debouncedSearchQuery' | 'searchConfig'>;

// Mirrors createZustandStoreWithImmer, which wraps the creator as devtools(immer(...)).
export type SearchStoreCreator = StateCreator<ISearchStore, [['zustand/devtools', never], ['zustand/immer', never]]>;
