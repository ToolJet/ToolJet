import { createJavaScriptSuggestions } from '@/Editor/CodeEditor/utils';
import { create, createReferencesLookup, zustandDevTools } from './utils';
import { getSuggestionKeys } from '@/Editor/CodeBuilder/utils';

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
    jsHints: createJavaScriptSuggestions(),
  },
  lookupTable: {
    hints: {},
    resolvedRefs: {},
  },
};

export const useResolveStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        updateAppSuggestions: (refState) => {
          // const suggestionTable = getSuggestionKeys(refState);
          const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(refState);

          set(() => ({ suggestions: { ...get().suggestions, appHints: suggestionList } }));

          set(() => ({ lookupTable: { ...get().lookupTable, hints: hintsMap, resolvedRefs } }));
        },
      },
    }),
    { name: 'Resolver Store' }
  )
);

export const useResolverStoreActions = useResolveStore.getState().actions;
