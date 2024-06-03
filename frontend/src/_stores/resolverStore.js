import { create } from 'zustand';
import { createReferencesLookup, findAllEntityReferences, findEntityId } from './utils';
import { createJavaScriptSuggestions } from '../Editor/CodeEditor/utils';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { dfs, removeAppSuggestions } from './handleReferenceTransactions';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

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
  (set, get) => ({
    ...initialState,
    actions: {
      updateStoreState: (state) => {
        set(() => ({ ...state, storeReady: true }));
      },
      resetStore: () => {
        set(() => initialState);
      },
      pageSwitched: (bool) => set(() => ({ isPageSwitched: bool })),
      updateAppSuggestions: (refState) => {
        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(refState, false, true);

        set(() => ({
          suggestions: { ...get().suggestions, appHints: suggestionList },
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
      addAppSuggestions: (partialRefState) => {
        if (Object.keys(partialRefState).length === 0) return;

        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(partialRefState);

        const _hintsMap = get().lookupTable.hints;
        const resolvedRefsMap = get().lookupTable.resolvedRefs;

        let lookupHintsMap, lookupResolvedRefs;

        if (_hintsMap.size > 0) {
          lookupHintsMap = new Map([..._hintsMap]);
        } else {
          lookupHintsMap = new Map();
        }

        if (resolvedRefsMap.size > 0) {
          lookupResolvedRefs = new Map([...resolvedRefsMap]);
        } else {
          lookupResolvedRefs = new Map();
        }

        const newUpdatedrefs = [];

        hintsMap.forEach((value, key) => {
          const alreadyExists = lookupHintsMap.has(key);

          if (!alreadyExists) {
            lookupHintsMap.set(key, value);
          } else {
            const existingLookupId = lookupHintsMap.get(key);
            const newResolvedRef = resolvedRefs.get(value);

            resolvedRefs.delete(value);
            resolvedRefs.set(existingLookupId, newResolvedRef);
            newUpdatedrefs.push(key);
          }
        });

        resolvedRefs.forEach((value, key) => {
          lookupResolvedRefs.set(key, value);
        });

        const uniqueAppHints = suggestionList.filter((hint) => {
          return !get().suggestions.appHints.find((h) => h.hint === hint.hint);
        });

        set(() => ({
          suggestions: {
            ...get().suggestions,
            appHints: [...get().suggestions.appHints, ...uniqueAppHints],
          },
          lookupTable: {
            ...get().lookupTable,
            hints: lookupHintsMap,
            resolvedRefs: lookupResolvedRefs,
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
  }),
  { name: 'Resolver Store' }
);

export const useResolverStoreActions = () => useResolveStore.getState().actions;
