// Code search panel input. Lives in the store so the term survives switching sidebar panels;
// results are derived from the app definition on render, never stored.
import type { RevealStep } from '@/AppBuilder/LeftSidebar/CodeSearch/buildSearchRecords';
import type { SearchFilters } from '@/AppBuilder/LeftSidebar/CodeSearch/searchRecords';

export type CodeSearchOptions = Required<SearchFilters>;
export type RevealRequest = RevealStep & { nonce: number };

// Where a result's field is and what it holds; the field's code editor takes it (codeSearchHighlight).
export interface FocusTarget {
  scope: string; // CSS selector of the opened panel, or of the opened request tab's pane
  keys: string[]; // the field's own path keys, as its wrappers are tagged (`data-param`)
  inOpenedTab: boolean; // the scope holds only this item, so any of `keys` may be the tagged one
  text: string; // the indexed field text
  start: number; // the clicked occurrence within `text`
  end: number;
}
export type FocusRequest = FocusTarget & { nonce: number };

export interface CodeSearchState {
  codeSearch: {
    term: string;
    options: CodeSearchOptions;
    returnToSearch: boolean;
    revealRequest: RevealRequest | null;
    focusRequest: FocusRequest | null;
  };
}

// The store's immer + devtools `set`.
type SetState = (recipe: (state: CodeSearchState) => void, replace: boolean, action: string) => void;

const initialState: CodeSearchState = {
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
    // The field to select once the reveal chain has opened its place: the code editor showing it
    // takes it and clears this (codeSearchHighlight); navigateToResult falls back when none does.
    focusRequest: null,
  },
};

// Unique per reveal / focus request (survives store resets), so a consumer clears only the request
// it saw.
let revealNonce = 0;

export const createCodeSearchSlice = (set: SetState) => ({
  ...initialState,
  setCodeSearchTerm: (term: string) =>
    set(
      (state) => {
        state.codeSearch.term = term;
      },
      false,
      'setCodeSearchTerm'
    ),
  setCodeSearchOptions: (options: Partial<CodeSearchOptions>) =>
    set(
      (state) => {
        state.codeSearch.options = { ...state.codeSearch.options, ...options };
      },
      false,
      'setCodeSearchOptions'
    ),
  setCodeSearchReturnToSearch: (returnToSearch: boolean) =>
    set(
      (state) => {
        state.codeSearch.returnToSearch = returnToSearch;
      },
      false,
      'setCodeSearchReturnToSearch'
    ),
  // Returns the request's nonce: it may already be opened (and cleared) by the time this returns.
  requestCodeSearchReveal: (step: RevealStep): number => {
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
  consumeCodeSearchReveal: (nonce: number) =>
    set(
      (state) => {
        if (state.codeSearch.revealRequest?.nonce === nonce) state.codeSearch.revealRequest = null;
      },
      false,
      'consumeCodeSearchReveal'
    ),
  // Returns the request's nonce: an editor may already have taken (and cleared) it on return.
  requestCodeSearchFocus: (target: FocusTarget): number => {
    const nonce = ++revealNonce;
    set(
      (state) => {
        state.codeSearch.focusRequest = { ...target, nonce };
      },
      false,
      'requestCodeSearchFocus'
    );
    return nonce;
  },
  // Clears the request only if it is still the one the caller saw, so a newer one survives.
  consumeCodeSearchFocus: (nonce: number) =>
    set(
      (state) => {
        if (state.codeSearch.focusRequest?.nonce === nonce) state.codeSearch.focusRequest = null;
      },
      false,
      'consumeCodeSearchFocus'
    ),
});
