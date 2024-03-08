import { create } from 'zustand';
import { createReferencesLookup, findAllEntityReferences, findEntityId } from './utils';
import { createJavaScriptSuggestions } from '../Editor/CodeEditor/utils';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { dfs } from './handleReferenceTransactions';

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

  referenceMapper: new ReferencesBiMap(),
};

export const useResolveStore = create(
  (set, get) => ({
    ...initialState,
    actions: {
      updateStoreState: (state) => {
        set(() => ({ ...state, storeReady: true }));
      },
      updateAppSuggestions: (refState) => {
        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(refState, false, true);

        set(() => ({ suggestions: { ...get().suggestions, appHints: suggestionList } }));

        set(() => ({ lookupTable: { ...get().lookupTable, hints: hintsMap, resolvedRefs } }));
      },

      addAppSuggestions: (partialRefState) => {
        if (Object.keys(partialRefState).length === 0) return;

        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(partialRefState);

        const lookupHintsMap = new Map([...get().lookupTable.hints]);
        const lookupResolvedRefs = new Map([...get().lookupTable.resolvedRefs]);

        hintsMap.forEach((value, key) => {
          const alreadyExists = lookupHintsMap.has(key);

          if (!alreadyExists) {
            lookupHintsMap.set(key, value);
          } else {
            const existingLookupId = lookupHintsMap.get(key);
            const newResolvedRef = resolvedRefs.get(value);

            resolvedRefs.delete(value);
            resolvedRefs.set(existingLookupId, newResolvedRef);
          }
        });

        resolvedRefs.forEach((value, key) => {
          lookupResolvedRefs.set(key, value);
        });

        set(() => ({
          suggestions: {
            ...get().suggestions,
            appHints: [...get().suggestions.appHints, ...suggestionList],
          },
        }));

        set(() => ({
          lookupTable: {
            ...get().lookupTable,
            hints: lookupHintsMap,
            resolvedRefs: lookupResolvedRefs,
          },
        }));
      },

      removeAppSuggestions: (suggestionsArray) => {
        if (suggestionsArray.length === 0) return new Promise((resolve) => resolve({ status: '' }));

        const lookupHintsMap = new Map([...get().lookupTable.hints]);
        const lookupResolvedRefs = new Map([...get().lookupTable.resolvedRefs]);
        const currentSuggestions = get().suggestions.appHints;

        suggestionsArray.forEach((suggestion) => {
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
          }));

          set(() => ({
            lookupTable: {
              ...get().lookupTable,
              hints: lookupHintsMap,
              resolvedRefs: lookupResolvedRefs,
            },
          }));

          resolve({ status: 'ok' });
        });
      },

      updateJSHints: () => {
        const hints = createJavaScriptSuggestions();
        set(() => ({ suggestions: { ...get().suggestions, jsHints: hints } }));
      },

      addEntitiesToMap: (entities) => {
        const { referenceMapper } = get();
        entities.forEach((entity) => {
          if (!referenceMapper.has(entity.id)) {
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

      getEntityId: (entityName) => {
        const { referenceMapper } = get();

        for (const [key, value] of referenceMapper._map) {
          if (value === entityName) {
            return referenceMapper.reverseGet(key);
          }
        }
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
          let diffObj = _.cloneDeep(obj);

          for (const [key, value] of Object.entries(entityRefs)) {
            diffObj = dfs(diffObj, key, value);
          }

          return diffObj;
        }

        return obj;
      },
    },
  }),
  { name: 'Resolver Store' }
);

export const useResolverStoreActions = () => useResolveStore.getState().actions;
