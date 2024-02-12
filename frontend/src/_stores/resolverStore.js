import { create } from 'zustand';
import { createReferencesLookup } from './utils';
import { createJavaScriptSuggestions } from '../Editor/CodeEditor/utils';
import { v4 as uuid } from 'uuid';

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
    return this._map.get(key);
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

      addComponentsToMapper: (components) => {
        const { referenceMapper } = get();
        components.forEach((component) => {
          // check if the component is already in the mapper with component id

          if (!referenceMapper.has(component.id)) {
            referenceMapper.set(component.id, component.name);
          }
        });
      },

      getReferenceMapper: () => {
        return get().referenceMapper;
      },
    },
  }),
  { name: 'Resolver Store' }
);

export const useResolverStoreActions = () => useResolveStore.getState().actions;
