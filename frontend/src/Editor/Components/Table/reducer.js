export const initialState = () => ({
  loadingState: false,
  columnProperties: {},
});

export const reducerActions = {
  setColumnProperties: (columnProperties) => ({
    type: 'MERGE',
    payload: { columnProperties },
  }),
};

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
