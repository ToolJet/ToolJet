export const initialState = () => ({
  loadingState: false,
  columnProperties: {},
});

const mergeToState = (payload) => ({
  type: 'MERGE',
  payload,
});

const set = (payload) => ({
  type: 'SET',
  payload,
});

export const reducerActions = {
  setColumnProperties: (columnProperties) => mergeToState({ columnProperties }),
  setSelectedRowId: (selectedRowId) => mergeToState({ selectedRowId }),
  setSelectedRowData: (selectedRowData) => mergeToState({ selectedRowData }),
  set,
};

export const reducer = (state, action) => {
  switch (action.type) {
    case 'MERGE':
      return {
        ...state,
        ...action.payload,
      };

    case 'SET':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return initialState();
  }
};
