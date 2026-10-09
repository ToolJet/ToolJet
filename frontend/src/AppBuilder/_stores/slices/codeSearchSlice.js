// Code search panel input. Lives in the store so the term survives switching sidebar panels;
// results are derived from the app definition on render, never stored.
const initialState = {
  codeSearch: {
    term: '',
    // Match options plus view settings; all survive switching sidebar panels.
    options: {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
      type: 'all', // result type filter: all | component | query | event | page | app
      currentPageOnly: false,
    },
  },
};

export const createCodeSearchSlice = (set) => ({
  ...initialState,
  setCodeSearchTerm: (term) =>
    set(
      (state) => {
        state.codeSearch.term = term;
      },
      false,
      'setCodeSearchTerm'
    ),
  setCodeSearchOptions: (options) =>
    set(
      (state) => {
        state.codeSearch.options = { ...state.codeSearch.options, ...options };
      },
      false,
      'setCodeSearchOptions'
    ),
});
