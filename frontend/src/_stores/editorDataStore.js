import { create, zustandDevTools } from './utils';
// TO-DO - Add editor dependent states here
const initialState = {
  currentState: {
    queries: {},
    components: {},
    // globals: {
    //   theme: { name: props.darkMode ? 'dark' : 'light' },
    //   urlparams: JSON.parse(JSON.stringify(queryString.parse(props.location.search))),
    // },
    errors: {},
    variables: {},
    client: {},
    server: {},
    page: {
      // handle: pageHandle,
      variables: {},
    },
  },
};

export const useEditorDataStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {},
  }))
);

export const useEditorCurrentState = () => useEditorDataStore((state) => state.currentState);
