import { create, zustandDevTools } from './utils';

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
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      setCurrentState: (currentState) => set({ ...currentState }),
    },
  }))
);
