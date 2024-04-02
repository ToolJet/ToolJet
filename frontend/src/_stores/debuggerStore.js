import { create, zustandDevTools } from './utils';

const initialState = {
  errors: {},
  succededQuery: {},
};

export const useDebuggerStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setErrors: (error) => {
          set({ errors: { ...get().errors, ...error } }, false, { type: 'SET_ERRORS', error });
        },
        clearErrors: () => set({ errors: {} }, false, { type: 'CLEAR_ERRORS' }),
        setSuccededQuery: (queryDetails) => {
          set({ succededQuery: { ...get().succededQuery, ...queryDetails } }, false, {
            type: 'SET_SUCCEDED_QUERY',
            queryDetails,
          });
        },
      },
    }),
    { name: 'Debugger Store' }
  )
);
