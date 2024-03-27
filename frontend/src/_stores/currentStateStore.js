import { shallow } from 'zustand/shallow';
import { create, zustandDevTools } from './utils';
import _, { debounce, omit } from 'lodash';
import { useResolveStore } from './resolverStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

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

function removeUndefined(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === 'object') removeUndefined(obj[key]);
    else if (obj[key] === undefined) delete obj[key];
  });

  return obj;
}

export const useCurrentStateStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setCurrentState: debounce((currentState) => {
          const currentStateEntites = Object.keys(currentState);

          const existingStateOfEntities = currentStateEntites.reduce((acc, entity) => {
            acc[entity] = get()[entity];
            return acc;
          }, {});

          const diffState = diff(existingStateOfEntities, currentState);

          if (_.isEmpty(diffState)) return;

          set({ ...currentState }, false, { type: 'SET_CURRENT_STATE', currentState });
        }, 300),
        setErrors: (error) => {
          set({ errors: { ...get().errors, ...error } }, false, { type: 'SET_ERRORS', error });
        },
        setEditorReady: (isEditorReady) => set({ isEditorReady }),
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

  const isStoreIntialized = useResolveStore.getState().storeReady;

  if (!isStoreIntialized) {
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
    useResolveStore.getState().actions.updateStoreState({ storeReady: true });
    console.log('Resolver store initialized with current state.');
    return;
  }
}, shallow);

export const getCurrentState = () => {
  return omit(useCurrentStateStore.getState(), 'actions');
};
