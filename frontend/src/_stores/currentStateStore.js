import { create, zustandDevTools } from './utils';
import { omit } from 'lodash';

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
};

export const useCurrentStateStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        setCurrentState: (currentState) => set({ ...currentState }),
      },
    }),
    { name: 'Current State' }
  )
);

// Omitting actions here because we don't want to expose it to user
export const useCurrentState = () => {
  return omit(useCurrentStateStore(), 'actions');
};

export const getCurrentState = () => {
  return omit(useCurrentStateStore.getState(), 'actions');
};
