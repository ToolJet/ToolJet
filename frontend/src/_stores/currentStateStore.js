import { shallow } from 'zustand/shallow';
import { create, zustandDevTools } from './utils';
import { omit } from 'lodash';
import { useContext } from 'react';
import { useSuperStore } from './superStore';
import { ModuleContext } from '../_contexts/ModuleContext';

export function createCurrentStateStore(moduleName) {
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
    moduleName,
  };

  return create(
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
          setTheme: (_theme) => {
            set({ globals: { ...get().globals, theme: { name: _theme } } }, false, {
              type: 'SET_THEME',
              _theme,
            });
          },
        },
      }),
      { name: 'Current State' }
    )
  );
}

export const useCurrentStateStore = (callback, shallow) => {
  const moduleName = useContext(ModuleContext);

  if (!moduleName) throw Error('module context not available');

  const _useCurrentStateStore = useSuperStore((state) => state.modules[moduleName].useCurrentStateStore);

  return _useCurrentStateStore(callback, shallow);
};

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

export const getCurrentState = (moduleName) => {
  return omit(useSuperStore.getState().modules[moduleName].useCurrentStateStore.getState(), 'actions');
};
