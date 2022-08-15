export const initialState = () => ({
  loadingState: false,
  columnProperties: {},
});

const mergeToState = (columnProperties) => ({
  type: 'MERGE',
  payload: { columnProperties },
});

export const reducerActions = { setColumnProperties: mergeToState };

export const reducer = (state = initialState(), action) => {
  switch (action.type) {
    case 'MERGE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return initialState();
  }
};
