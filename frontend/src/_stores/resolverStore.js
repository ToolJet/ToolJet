import { createJavaScriptSuggestions } from '@/Editor/CodeEditor/utils';
import { create, zustandDevTools } from './utils';
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
};

export const useResolveStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        updateAppSuggestions: (refState) => {
          const suggestionTable = getSuggestionKeys(refState);

          set(() => ({ suggestions: { ...get().suggestions, appHints: suggestionTable } }));
        },
      },
    }),
    { name: 'Resolver Store' }
  )
);

export const useResolverStoreActions = useResolveStore.getState().actions;
