import { shallow } from 'zustand/shallow';
import { create, zustandDevTools } from './utils';
import _, { omit } from 'lodash';
import { useResolveStore } from './resolverStore';
import { handleLowPriorityWork, updateCanvasBackground } from '@/_helpers/editorHelpers';
import { useEditorStore } from '@/_stores/editorStore';

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
  constants: {},
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
        setCurrentState: (currentState) => {
          set({ ...currentState }, false, { type: 'SET_CURRENT_STATE', currentState });
        },
        setErrors: (error) => {
          set({ errors: { ...get().errors, ...error } }, false, { type: 'SET_ERRORS', error });
        },
        setEditorReady: (isEditorReady) => set({ isEditorReady }),
        initializeCurrentStateOnVersionSwitch: () => {
          const newInitialState = {
            ...initialState,
            constants: get().constants,
          };
          set({ ...newInitialState }, false, {
            type: 'INITIALIZE_CURRENT_STATE_ON_VERSION_SWITCH',
            newInitialState,
          });
        },
      },
    }),
    { name: 'Current State' }
  )
);

export const useCurrentState = () =>
  // Omitting 'actions' here because we don't want to expose it to user
  useCurrentStateStore((state) => {
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

useCurrentStateStore.subscribe((state) => {
  const isEditorReady = state.isEditorReady;

  if (!isEditorReady) return;

  // TODO: Change the logic of updating canvas background
  updateCanvasBackground(useEditorStore.getState().canvasBackground);

  const isStoreIntialized = useResolveStore.getState().storeReady;
  if (!isStoreIntialized) {
    const isPageSwitched = useResolveStore.getState().isPageSwitched;

    handleLowPriorityWork(
      () => {
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
        useResolveStore.getState().actions.pageSwitched(false);
      },
      null,
      isPageSwitched
    );

    return useResolveStore.getState().actions.updateStoreState({ storeReady: true });
  }
}, shallow);

export const getCurrentState = () => {
  return omit(useCurrentStateStore.getState(), 'actions');
};
