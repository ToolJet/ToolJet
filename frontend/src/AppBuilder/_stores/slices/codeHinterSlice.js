import { createReferencesLookup } from '@/AppBuilder/_stores/utils';
import { createJavaScriptSuggestions } from '@/AppBuilder/CodeEditor/utils';

const initialState = {
  shouldBuildSuggestions: false,
  suggestions: {
    appHints: [],
    jsHints: [],
  },
};

export const createCodeHinterSlice = (set, get) => ({
  ...initialState,
  checkAndSetTrueBuildSuggestionsFlag: () => {
    if (!get().shouldBuildSuggestions) {
      set(() => ({ shouldBuildSuggestions: true }), false, 'checkAndSetTrueBuildSuggestionsFlag');
    }
  },
  setShouldBuildSuggestions: (shouldBuildSuggestions) =>
    set(() => ({ shouldBuildSuggestions }), false, 'setShouldBuildSuggestions'),
  setAppHints: () => {
    set(
      (state) => {
        const suggestionList = createReferencesLookup(get().getResolvedState());
        state.suggestions.appHints = suggestionList;
      },
      false,
      'setAppHints'
    );
  },
  setSuggestions: (suggestions) => set(() => ({ suggestions }), false, 'setSuggestions'),
  initAppSuggestions: () => {
    const { setSuggestions, getResolvedState } = get();
    const suggestionList = createReferencesLookup(getResolvedState());
    const jsHints = createJavaScriptSuggestions();
    setSuggestions({ appHints: suggestionList, jsHints: jsHints });
  },
  getSuggestions: () => get().suggestions,
  getServerSideGlobalSuggestions: (isInsideQueryManager) => {
    const isServerSideGlobalEnabled = !!get()?.license?.featureAccess?.serverSideGlobal;
    const serverHints = [];
    const hints = get().getSuggestions();
    if (isInsideQueryManager && isServerSideGlobalEnabled) {
      hints?.appHints?.forEach((appHint) => {
        if (appHint?.hint?.startsWith('globals.currentUser')) {
          const key = appHint?.hint?.replace('globals.currentUser', 'globals.server.currentUser');
          serverHints.push({
            hint: key,
            type: appHint?.type,
          });
        }
      });
    }

    return serverHints;
  },
});
