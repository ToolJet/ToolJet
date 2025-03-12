export const initialState = () => ({
  loadingState: false,
  columnProperties: [],
  filterDetails: {
    filters: [],
    filtersVisible: false,
  },
  addNewRowsDetails: {
    addingNewRows: false,
    newRowsDataUpdates: {},
    newRowsChangeSet: {},
  },
});

const mergeToTableDetails = (payload) => ({
  type: 'MERGE_TO_TABLE_DETAILS',
  payload,
});

const mergeToFilterDetails = (payload) => ({
  type: 'MERGE_TO_FILTER_DETAILS',
  payload,
});

const mergeToAddNewRowsDetails = (payload) => ({
  type: 'MERGE_TO_ADD_NEW_ROWS',
  payload,
});

export const reducerActions = {
  mergeToFilterDetails,
  mergeToTableDetails,
  mergeToAddNewRowsDetails,
};

export const reducer = (state, action) => {
  switch (action.type) {
    case 'MERGE_TO_TABLE_DETAILS':
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
    case 'MERGE_TO_ADD_NEW_ROWS':
      return {
        ...state,
        addNewRowsDetails: {
          ...state.addNewRowsDetails,
          ...action.payload,
        },
      };
    default:
      return initialState();
  }
};
