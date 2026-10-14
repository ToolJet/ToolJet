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
    // Global settings was opened from a result, so its header links back to the search panel.
    returnToSearch: false,
    // One step of a result's reveal chain, `{ kind, ownerId, itemId, nonce }`: the place that owns
    // the item (a popover, list row or tab, via useCodeSearchReveal) opens it and clears this.
    revealRequest: null,
  },
};

// Unique per reveal request (survives store resets), so a consumer clears only the request it saw.
let revealNonce = 0;

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
  setCodeSearchReturnToSearch: (returnToSearch) =>
    set(
      (state) => {
        state.codeSearch.returnToSearch = returnToSearch;
      },
      false,
      'setCodeSearchReturnToSearch'
    ),
  // Returns the request's nonce: it may already be opened (and cleared) by the time this returns.
  requestCodeSearchReveal: (step) => {
    const nonce = ++revealNonce;
    set(
      (state) => {
        state.codeSearch.revealRequest = { ...step, nonce };
      },
      false,
      'requestCodeSearchReveal'
    );
    return nonce;
  },
  // Clears the request only if it is still the one the caller saw, so a newer one survives.
  consumeCodeSearchReveal: (nonce) =>
    set(
      (state) => {
        if (state.codeSearch.revealRequest?.nonce === nonce) state.codeSearch.revealRequest = null;
      },
      false,
      'consumeCodeSearchReveal'
    ),
});
