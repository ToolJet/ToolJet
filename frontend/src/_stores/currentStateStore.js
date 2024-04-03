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
        setCurrentState: (currentState) => {
          const currentStateEntites = Object.keys(currentState);

          const existingStateOfEntities = currentStateEntites.reduce((acc, entity) => {
            acc[entity] = get()[entity];
            return acc;
          }, {});

          const diffState = diff(existingStateOfEntities, currentState);

          if (_.isEmpty(diffState)) return;

          set({ ...currentState }, false, { type: 'SET_CURRENT_STATE', currentState });

          //need to track only queries, components, variables, page, constants, layout
          // from the diff, if any of these entities are changed, we need to update the store

          if (get().isEditorReady) {
            const entitiesToTrack = ['queries', 'components', 'variables', 'page', 'constants', 'layout'];

            const entitiesChanged = Object.keys(diffState).filter((entity) => entitiesToTrack.includes(entity));

            const diffObj = entitiesChanged.reduce((acc, entity) => {
              acc[entity] = diffState[entity];
              return acc;
            }, {});

            const allPaths = entitiesChanged.reduce((acc, entity) => {
              const paths = Object.keys(diffObj[entity]).map((key) => {
                return generatePath(diffObj[entity], key);
              });

              acc[entity] = paths.map((path) => `${entity}.${path}`).join(',');
              return acc;
            }, {});

            const currentStatePaths = Object.values(allPaths);

            useEditorStore.getState().actions.updateCurrentStateDiff(currentStatePaths);
          }
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
