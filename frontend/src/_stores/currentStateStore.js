import { shallow } from 'zustand/shallow';
import { create, zustandDevTools } from './utils';
import _, { omit } from 'lodash';
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

useCurrentStateStore.subscribe((state, prevState) => {
  const isEditorReady = state.isEditorReady;

  if (!isEditorReady) return;

  const stateRequiredForRefs = {
    queries: state.queries,
    components: state.components,
    globals: state.globals,
    variables: state.variables,
    client: state.client,
    server: state.server,
    page: state.page,
    constants: state.constants,
  };

  const previousState = {
    globals: prevState.globals,
    variables: prevState.variables,
    page: prevState.page,
  };

  const isStoreIntialized = useResolveStore.getState().storeReady;

  if (!isStoreIntialized) {
    useResolveStore.getState().actions.updateAppSuggestions(stateRequiredForRefs);
    useResolveStore.getState().actions.updateStoreState({ storeReady: true });
    console.log('Resolver store initialized with current state.');
    return;
  }

  const latestCurrentState = _.omit(stateRequiredForRefs, 'components', 'queries', 'server', 'client', 'constants');

  const didComponentsChange = JSON.stringify(latestCurrentState) !== JSON.stringify(previousState);
  let diffInState = didComponentsChange ? diff(previousState, latestCurrentState) : {};

  if (!didComponentsChange || _.isEmpty(diffInState)) return;

  const undefinedPaths = Object.keys(findPathForObjWithUndefined(diffInState));
  diffInState = removeUndefined(diffInState);

  useResolveStore
    .getState()
    .actions.removeAppSuggestions(undefinedPaths)
    .then((resp) => {
      const suggestionObj = removeChildNodesWithEmptyValues(diffInState);

      if (resp?.status === 'ok' && !_.isEmpty(suggestionObj)) {
        useResolveStore.getState().actions.addAppSuggestions(suggestionObj);
      }
    });
}, shallow);

export const getCurrentState = () => {
  return omit(useCurrentStateStore.getState(), 'actions');
};

function removeUndefined(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === 'object') removeUndefined(obj[key]);
    else if (obj[key] === undefined || _.isEmpty(obj[key])) delete obj[key];
  });

  return obj;
}

function removeChildNodesWithEmptyValues(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === 'object') {
      removeChildNodesWithEmptyValues(obj[key]);
      if (_.isEmpty(obj[key])) {
        delete obj[key];
      }
    }
  });

  return obj;
}

function findPathForObjWithUndefined(obj, path = undefined) {
  let result = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === 'object') {
      const objPath = path ? `${path}.${key}` : key;
      result = { ...result, ...findPathForObjWithUndefined(obj[key], objPath) };
    } else if (obj[key] === undefined || _.isEmpty(obj[key])) {
      result = { ...result, [`${path}.${key}`]: obj[key] };
    }
  });

  return result;
}
