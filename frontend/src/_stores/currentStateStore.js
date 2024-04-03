import { shallow } from 'zustand/shallow';
import { create, zustandDevTools } from './utils';
import _, { debounce, merge, omit } from 'lodash';
import { useResolveStore } from './resolverStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { useEditorStore } from './editorStore';
import { handleLowPriorityWork } from '@/_helpers/editorHelpers';

const initialState = {
  queries: {},
  components: {},
  globals: {
    theme: { name: 'light' },
    urlparams: null,
  },
  errors: {},
  variables: {},
  client: {},
  server: {},
  page: {
    handle: '',
    variables: {},
  },
  succededQuery: {},
  isEditorReady: false,
};

function generatePath(obj, targetKey, currentPath = '') {
  for (const key in obj) {
    const newPath = currentPath ? currentPath + '.' + key : key;

    if (key === targetKey) {
      return newPath;
    }

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = generatePath(obj[key], targetKey, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export const useCurrentStateStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setCurrentState: (currentState, from = null) => {
          const newState = merge({}, get(), currentState);

          set({ ...newState });
        },
        setErrors: (error) => {
          set({ errors: { ...get().errors, ...error } }, false, { type: 'SET_ERRORS', error });
        },
        setEditorReady: (isEditorReady) => set({ isEditorReady }),
      },
    }),
    { name: 'Current State' }
  )
);

export const useCurrentState = () => {
  // Omitting 'actions' here because we don't want to expose it to user
  const currentState = useCurrentStateStore((state) => {
    return {
      queries: state.queries,
      components: state.components,
      globals: state.globals,
      errors: state.errors,
      variables: state.variables,
      client: state.client,
      server: state.server,
      page: state.page,
      succededQuery: state.succededQuery,
      constants: state.constants,
      layout: state.layout,
    };
  }, shallow);

  return JSON.parse(JSON.stringify(currentState));
};

useCurrentStateStore.subscribe((state) => {
  const isEditorReady = state.isEditorReady;

  if (!isEditorReady) return;

  const isStoreIntialized = useResolveStore.getState().storeReady;

  if (!isStoreIntialized) {
    handleLowPriorityWork(() => {
      useResolveStore.getState().actions.updateAppSuggestions({
        queries: state.queries,
        components: state.components,
        globals: state.globals,
        page: state.page,
        variables: state.variables,
        client: state.client,
        server: state.server,
        constants: state.constants,
      });
    });
    console.log('Resolver store initialized with current state.');
    return useResolveStore.getState().actions.updateStoreState({ storeReady: true });
  }
}, shallow);

export const getCurrentState = () => {
  return omit(useCurrentStateStore.getState(), 'actions');
};
