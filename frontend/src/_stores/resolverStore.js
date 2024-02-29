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
      updateAppSuggestions: (refState) => {
        const { suggestionList, hintsMap, resolvedRefs } = createReferencesLookup(refState);

        set(() => ({ suggestions: { ...get().suggestions, appHints: suggestionList } }));

        set(() => ({ lookupTable: { ...get().lookupTable, hints: hintsMap, resolvedRefs } }));
      },

      updateJSHints: () => {
        const hints = createJavaScriptSuggestions();
        set(() => ({ suggestions: { ...get().suggestions, jsHints: hints } }));
      },

      updateComponentDefaultValues: (componentDefaultValues) => {
        set(() => ({ componentDefaultValues }));
      },

      getDefaultComponentValue: (componentName) => {
        const { componentDefaultValues } = get();
        return componentDefaultValues[componentName];
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
