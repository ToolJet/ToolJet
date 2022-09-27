export const initialState = () => ({
  loadingState: false,
  columnProperties: [],
  filterDetails: {
    filters: [],
    filtersVisible: false,
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

export const reducerActions = {
  mergeToFilterDetails,
  mergeToTableDetails,
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

    default:
      return initialState();
  }
};
