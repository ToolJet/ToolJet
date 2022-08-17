export const initialState = () => ({
  loadingState: false,
  columnProperties: [],
  filterDetails: {
    filters: [],
    filtersVisible: false,
  },
});

const mergeToState = (payload) => ({
  type: 'MERGE',
  payload,
});

const set = (payload) => ({
  type: 'SET',
  payload,
});

const mergeToFilterDetails = (payload) => ({
  type: 'MERGE_TO_FILTER_DETAILS',
  payload,
});

export const reducerActions = {
  setColumnProperties: (columnProperties) => mergeToState({ columnProperties }),
  setSelectedRowId: (selectedRowId) => mergeToState({ selectedRowId }),
  setSelectedRowData: (selectedRowData) => mergeToState({ selectedRowData }),
  set,
  mergeToFilterDetails,
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

    case 'MERGE_TO_FILTER_DETAILS':
      return {
        ...state,
        filterDetails: {
          ...state.filterDetails,
          ...action.payload,
        },
      };

    default:
      return initialState();
  }
};
