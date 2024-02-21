import { create } from 'zustand';
import { createReferencesLookup } from './utils';
import { createJavaScriptSuggestions } from '../Editor/CodeEditor/utils';

/**
 * *Resolver Store
 * This Zustand store is named 'ResolverStore' and it's designed for a dual purpose:
 * 1. Initially, it will be used to manage and store autocomplete suggestions for UI components.
 * 2. In the later stages of development, this store will evolve to serve as a resolver mapper,
 *    responsible for resolving component, queries names to their respective IDs.
 */

const initialState = {
  suggestions: {
    appHints: [],
    jsHints: [],
  },
  lookupTable: {
    hints: {},
    resolvedRefs: {},
  },
};

export const useResolveStore = create(
  (set, get) => ({
    ...initialState,
    actions: {
      updateAppSuggestions: (refState) => {
        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(refState);

        set(() => ({ suggestions: { ...get().suggestions, appHints: suggestionList } }));

        set(() => ({ lookupTable: { ...get().lookupTable, hints: hintsMap, resolvedRefs } }));
      },

      updateJSHints: () => {
        const hints = createJavaScriptSuggestions();
        set(() => ({ suggestions: { ...get().suggestions, jsHints: hints } }));
      },
    },
  }),
  { name: 'Resolver Store' }
);

export const useResolverStoreActions = () => useResolveStore.getState().actions;
