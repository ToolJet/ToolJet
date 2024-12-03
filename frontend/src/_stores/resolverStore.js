import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createReferencesLookup, findAllEntityReferences, findEntityId } from './utils';
import { createJavaScriptSuggestions } from '@/AppBuilder/CodeEditor/utils';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { dfs, removeAppSuggestions } from './handleReferenceTransactions';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

import { findComponentsWithReferences } from '@/_helpers/editorHelpers';

import { flushComponentsToRender, useEditorStore } from '@/_stores/editorStore';

class ReferencesBiMap {
  constructor() {
    this._map = new Map();
    this._reverseMap = new Map();
  }

  set(key, value) {
    const lookupId = uuid();

    this._map.set(key, lookupId);
    this._reverseMap.set(lookupId, value);
  }

  has(key) {
    return this._map.has(key);
  }

  get(key) {
    const lookupid = this._map.get(key);

    return this._reverseMap.get(lookupid);
  }

  reverseGet(key) {
    return this._reverseMap.get(key);
  }

  update(id, value) {
    const lookUpId = this._map.get(id);
    this._reverseMap.set(lookUpId, value);
  }

  delete(key) {
    const value = this._map.get(key);
    this._map.delete(key);
    this._reverseMap.delete(value);
  }

  getAll = () => {
    return Array.from(this._map.values());
  };
}

const initialState = {
  storeReady: false,
  suggestions: {
    appHints: [],
    jsHints: [],
  },
  lookupTable: {
    hints: {},
    resolvedRefs: {},
  },
  lastUpdatedRefs: [],
  referenceMapper: new ReferencesBiMap(),
  isPageSwitched: false,
};

export const useResolveStore = create(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    actions: {
      updateStoreState: (state) => {
        set(() => ({ ...state, storeReady: true }));
      },
      resetStore: () => {
        set(() => ({ ...initialState, referenceMapper: new ReferencesBiMap() }));
      },
      resetHintsByKey: (hintKey) => {
        set((state) => {
          // Filter out app hints related to the specified query
          const newAppHints = state.suggestions.appHints.filter((hint) => !hint.hint.startsWith(`${hintKey}.`));

          if (!isIterable(state.lookupTable.hints) || !isIterable(state.lookupTable.resolvedRefs)) {
            return { ...state };
          }

          const newHints = new Map(state.lookupTable.hints);
          const newResolvedRefs = new Map(state.lookupTable.resolvedRefs);

          // Remove entries from hints and resolvedRefs
          for (const [key, value] of newHints) {
            if (key.startsWith(`${hintKey}.`)) {
              newHints.delete(key);
              newResolvedRefs.delete(value);
            }
          }

          return {
            suggestions: {
              ...state.suggestions,
              appHints: newAppHints,
            },
            lookupTable: {
              hints: newHints,
              resolvedRefs: newResolvedRefs,
            },
            lastUpdatedRefs: state.lastUpdatedRefs.filter((ref) => !ref.startsWith(`${hintKey}.`)),
          };
        });
      },

      pageSwitched: (bool) => set(() => ({ isPageSwitched: bool })),
      updateAppSuggestions: (refState) => {
        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(refState, false, true);

        const suggestions = get().suggestions;
        suggestions.appHints = suggestionList;

        set(() => ({
          suggestions: suggestions,
          lookupTable: { ...get().lookupTable, hints: hintsMap, resolvedRefs },
        }));
      },

      flushLastUpdatedRefs: () => {
        set(() => ({ lastUpdatedRefs: [] }));
      },
      getLastUpdatedRefs: () => {
        return get().lastUpdatedRefs;
      },
      //for queries references used in component definitons
      updateLastUpdatedRefs: (updatedRefs) => {
        set(() => ({ lastUpdatedRefs: updatedRefs }));
      },
      addAppSuggestions: (partialRefState, intialLoad = false) => {
        if (Object.keys(partialRefState).length === 0) return;

        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(partialRefState, false, intialLoad);

        const _hintsMap = get().lookupTable.hints;
        const resolvedRefsMap = get().lookupTable.resolvedRefs;

        let lookupHintsMap = _hintsMap.size > 0 ? new Map([..._hintsMap]) : new Map();
        let lookupResolvedRefs = resolvedRefsMap.size > 0 ? new Map([...resolvedRefsMap]) : new Map();

        const newUpdatedrefs = [];
        const updates = new Map();

        hintsMap.forEach((value, key) => {
          if (!lookupHintsMap.has(key)) {
            lookupHintsMap.set(key, value);
            if (key.startsWith('variable') || key.startsWith('page.variables')) {
              newUpdatedrefs.push(key);
            }
          } else {
            const existingLookupId = lookupHintsMap.get(key);
            const newResolvedRef = resolvedRefs.get(value);

            updates.set(existingLookupId, newResolvedRef);
            newUpdatedrefs.push(key);
          }
        });

        updates.forEach((newResolvedRef, existingLookupId) => {
          resolvedRefs.set(existingLookupId, newResolvedRef);
        });

        updates.forEach((_, existingLookupId) => {
          resolvedRefs.delete(existingLookupId);
        });

        resolvedRefs.forEach((value, key) => {
          lookupResolvedRefs.set(key, value);
        });

        const uniqueAppHints = suggestionList.filter(
          (hint) => !get().suggestions.appHints.some((h) => h.hint === hint.hint)
        );

        set(() => ({
          suggestions: {
            ...get().suggestions,
            appHints: [...get().suggestions.appHints, ...uniqueAppHints],
          },
          lookupTable: {
            ...get().lookupTable,
            hints: lookupHintsMap,
            resolvedRefs: new Map([...lookupResolvedRefs, ...updates]),
          },
          lastUpdatedRefs: newUpdatedrefs,
        }));
      },

      removeAppSuggestions: (suggestionsArray) => {
        if (suggestionsArray?.length === 0) return new Promise((resolve) => resolve({ status: '' }));

        const lookupHintsMap = new Map([...get().lookupTable.hints]);
        const lookupResolvedRefs = new Map([...get().lookupTable.resolvedRefs]);
        const currentSuggestions = get().suggestions.appHints;

        suggestionsArray?.forEach((suggestion) => {
          const index = currentSuggestions.findIndex((s) => s.hint === suggestion);

          if (index === -1) return;

          currentSuggestions.splice(index, 1);
          const lookUpId = lookupHintsMap.get(suggestion);

          lookupHintsMap.delete(suggestion);
          lookupResolvedRefs.delete(lookUpId);
        });

        return new Promise((resolve) => {
          set(() => ({
            suggestions: {
              ...get().suggestions,
              appHints: currentSuggestions,
            },

            lookupTable: {
              ...get().lookupTable,
              hints: lookupHintsMap,
              resolvedRefs: lookupResolvedRefs,
            },
          }));

          resolve({ status: 'ok' });
        });
      },

      updateResolvedRefsOfHints: (resolvedRefs = []) => {
        const lookupResolvedRefs = new Map([...get().lookupTable.resolvedRefs]);
        const hintsMap = new Map([...get().lookupTable.hints]);

        const updatedList = [];

        resolvedRefs.forEach((ref) => {
          if (
            !ref.hint ||
            (typeof ref.newRef === 'string' && ref.newRef !== '' && !ref.newRef) ||
            !hintsMap.has(ref.hint)
          )
            return;

          const refId = hintsMap.get(ref.hint);
          const currentRef = lookupResolvedRefs.get(refId);

          if (currentRef !== ref.newRef) {
            lookupResolvedRefs.set(refId, ref.newRef);
            updatedList.push(ref.hint);
          }
        });

        if (updatedList.length > 0) {
          set(() => ({
            lookupTable: {
              ...get().lookupTable,
              resolvedRefs: lookupResolvedRefs,
            },
            lastUpdatedRefs: updatedList,
          }));
        }
      },

      updateJSHints: () => {
        const hints = createJavaScriptSuggestions();
        set(() => ({ suggestions: { ...get().suggestions, jsHints: hints } }));
      },

      addEntitiesToMap: (entities) => {
        if (!Array.isArray(entities) || entities.length === 0) return;

        const { referenceMapper } = get();

        entities.forEach((entity) => {
          if (entity?.id && !referenceMapper.has(entity.id)) {
            referenceMapper.set(entity.id, entity.name);
          }
        });
      },

      removeEntitiesFromMap: (entitiesIds) => {
        const { referenceMapper } = get();

        entitiesIds.forEach((entityId) => {
          referenceMapper.delete(entityId);
        });
      },

      getReferenceMapper: () => {
        return get().referenceMapper;
      },

      findReferences: (obj) => {
        const entityNameReferences = findAllEntityReferences(obj, []);

        if (entityNameReferences.length === 0) return obj;

        function findEntityIdsFromRefNames(refs) {
          const entityMap = {};
          const manager = get().referenceMapper;

          refs.forEach((entityName) => {
            if (!entityName) return;

            entityMap[entityName] = findEntityId(entityName, manager._map, manager._reverseMap);
          });

          return entityMap;
        }

        const entityRefs = findEntityIdsFromRefNames(entityNameReferences);

        if (!_.isEmpty(entityRefs)) {
          let diffObj = deepClone(obj);

          for (const [key, value] of Object.entries(entityRefs)) {
            diffObj = dfs(diffObj, key, value);
          }

          return diffObj;
        }

        return obj;
      },
      handleUpdatesOnReferencingEnities: (updatedEntityName) => {
        if (!updatedEntityName) return;
        const referencesSubstring = updatedEntityName.type + '.' + updatedEntityName.name;
        const allRefsInHints = [];
        const toDeleteAppHints = [];
        const lookupHintsMap = new Map(deepClone([...get().lookupTable.hints]));
        const currentSuggestions = get().suggestions.appHints;

        lookupHintsMap.forEach((value, key) => {
          if (key.includes(referencesSubstring)) {
            const newReference = key.replace(
              referencesSubstring,
              updatedEntityName.type + '.' + updatedEntityName.newName
            );

            allRefsInHints.push({ refKey: key, refId: value, newRefKey: newReference });
            toDeleteAppHints.push({ old: key, newHint: newReference });
          }
        });

        allRefsInHints.forEach((ref) => {
          if (!lookupHintsMap.has(ref.refKey)) {
            return;
          }

          lookupHintsMap.delete(ref.refKey);
          lookupHintsMap.set(ref.newRefKey, ref.refId);
        });

        const newAppHints = removeAppSuggestions(currentSuggestions, toDeleteAppHints);

        set(() => {
          return {
            suggestions: {
              ...get().suggestions,
              appHints: newAppHints,
            },
            lookupTable: {
              ...get().lookupTable,
              hints: lookupHintsMap,
            },
          };
        });
      },
    },
  })),
  { name: 'Resolver Store' }
);

// Subscribed only to lastUpdatedRefs and compute the components that needs to be re-rendered
useResolveStore.subscribe(
  (state) => state.lastUpdatedRefs,
  (lastUpdatedRefs) => {
    if (lastUpdatedRefs.length > 0) {
      const currentComponents =
        useEditorStore.getState().appDefinition?.pages?.[useEditorStore.getState().currentPageId]?.components || {};

      const directRenders = lastUpdatedRefs
        .map((ref) => ref.includes('rerender') && ref.split(' ')[1])
        .filter((item) => item !== false);

      const toUpdateRefs = lastUpdatedRefs.filter((ref) => !ref.includes('rerender'));

      const componentIdsWithReferences = findComponentsWithReferences(currentComponents, toUpdateRefs);

      if (directRenders.length > 0) {
        componentIdsWithReferences.push(...directRenders);
      }

      if (componentIdsWithReferences.length > 0) {
        batchUpdateComponents(componentIdsWithReferences);
      }
    }
  }
);

/**
 ** Async updates components in batches to optimize and processing efficiency.
 * This function iterates over an array of component IDs, updating them in fixed-size batches,
 * and introduces a delay after each batch to allow the UI thread to manage other tasks, such as rendering updates.
 * After all batches are processed, it flushes the updates to clear any flags or temporary states indicating pending updates,
 * ensuring the system is ready for the next cycle of updates.
 *
 * @param {Array} componentIds An array of component IDs that need updates.
 * @returns {Promise<void>} A promise that resolves once all batches have been processed and flushed.
 */

async function batchUpdateComponents(componentIds) {
  if (componentIds.length === 0) return;

  let updatedComponentIds = [];

  for (let i = 0; i < componentIds.length; i += 10) {
    const batch = componentIds.slice(i, i + 10);
    batch.forEach((id) => {
      updatedComponentIds.push(id);
    });

    useEditorStore.getState().actions.updateComponentsNeedsUpdateOnNextRender(batch);
  }
}

export const useResolverStoreActions = () => useResolveStore.getState().actions;

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}
