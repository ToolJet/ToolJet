export const initialState = () => ({
  loadingState: false,
  columnProperties: [],
  filterDetails: {
    filters: [],
    filtersVisible: false,
  },
  addNewRowDetails: {
    addingNewRow: false,
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

const mergeToAddNewRowDetails = (payload) => ({
  type: 'MERGE_TO_ADD_NEW_ROW',
  payload,
});

export const reducerActions = {
  mergeToFilterDetails,
  mergeToTableDetails,
  mergeToAddNewRowDetails,
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
    case 'MERGE_TO_ADD_NEW_ROW':
      return {
        ...state,
        addNewRowDetails: {
          ...state.addNewRowDetails,
          ...action.payload,
        },
      };
    default:
      return initialState();
  }
};
