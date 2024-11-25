import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import { getLastDepth, getLastSubstring } from './autocompleteUtils';

export const getAutocompletion = (input, fieldType, hints, totalReferences = 1, originalQueryInput = null) => {
  if (!input.startsWith('{{') || !input.endsWith('}}')) return [];

  const actualInput = removeNestedDoubleCurlyBraces(input);

  let JSLangHints = [];

  if (fieldType) {
    JSLangHints = hints['jsHints'][fieldType]['methods'].map((hint) => ({
      hint: hint,
      type: 'js_method',
    }));
  } else {
    JSLangHints = Object.keys(hints['jsHints'])
      .map((key) => {
        return hints['jsHints'][key]['methods'].map((hint) => ({
          hint: hint,
          type: 'js_method',
        }));
      })
      .flat();
  }

  const deprecatedWorkspaceVarsHints = ['client', 'server'];

  const appHints = hints['appHints'].filter((cm) => {
    const { hint } = cm;

    if (hint.includes('actions') || hint.endsWith('run()')) {
      return false;
    }

    if (deprecatedWorkspaceVarsHints.includes(hint)) {
      return false;
    }

    const lastChar = hint[cm.length - 1];
    if (lastChar === ')') {
      return false;
    }

    return true;
  });

  const appHintsFilteredByDepth = filterHintsByDepth(actualInput, appHints);

  const autoSuggestionList = appHintsFilteredByDepth.filter((suggestion) => {
    if (actualInput.length === 0) return true;
    return suggestion.hint.includes(actualInput);
  });

  const jsHints = JSLangHints.filter((cm) => {
    const lastCharsAfterDot = actualInput.split('.').pop();
    if (cm.hint.includes(lastCharsAfterDot)) return true;

    if (autoSuggestionList.length === 0 && !cm.hint.includes(actualInput)) return true;
  });

  const searchInput = removeNestedDoubleCurlyBraces(input);
  const suggestions = generateHints(
    [...jsHints, ...autoSuggestionList],
    totalReferences,
    originalQueryInput,
    searchInput
  );
  return orderSuggestions(suggestions, fieldType);
};

function orderSuggestions(suggestions, validationType) {
  if (!validationType) return suggestions;

  const matchingSuggestions = suggestions.filter((s) => s.detail === validationType);

  const otherSuggestions = suggestions.filter((s) => s.detail !== validationType);

  return [...matchingSuggestions, ...otherSuggestions];
}

export const generateHints = (hints, totalReferences = 1, input, searchText) => {
  if (!hints) return [];

  const suggestions = hints.map(({ hint, type }) => {
    let displayedHint = type === 'js_method' || (type === 'Function' && !hint.endsWith('.run()')) ? `${hint}()` : hint;

    const currentWord = input.split('{{').pop().split('}}')[0];
    const hasDepth = currentWord.includes('.');
    const lastDepth = getLastSubstring(currentWord);

    const displayLabel = getLastDepth(displayedHint);

    return {
      displayLabel: lastDepth === '' ? displayedHint : displayLabel,
      label: displayedHint,
      info: displayedHint,
      type: type === 'js_method' ? 'js_methods' : type?.toLowerCase(),
      section:
        type === 'js_method'
          ? { name: 'JS methods', rank: 2 }
          : { name: !hasDepth ? 'Suggestions' : lastDepth, rank: 1 },
      detail: type === 'js_method' ? 'method' : type?.toLowerCase() || '',
      apply: (view, completion, from, to) => {
        const doc = view.state.doc;
        const { from: _, to: end } = doc.lineAt(from);
        const actualStartIndex = input.lastIndexOf('{{');

        const pickedFrom =
          actualStartIndex === 0 && end - to > 2 ? from - currentWord.length : actualStartIndex + (end - to);
        const pickedCompletionConfig = {
          from: pickedFrom,
          to: to,
          insert: completion.label,
        };

        let anchorSelection = pickedCompletionConfig.insert.length + 2;

        if (completion.type === 'js_methods') {
          pickedCompletionConfig.from = from;
        }

        const multiReferenceInSingleIndentifier = totalReferences == 1 && searchText !== currentWord;

        if (multiReferenceInSingleIndentifier) {
          const splitAtSearchString = doc.toString().split(searchText)[0];
          const newFrom = splitAtSearchString.length;

          pickedCompletionConfig.from = newFrom;
        } else if (totalReferences > 1 && completion.type !== 'js_methods') {
          const splitIndex = from;
          const substring = doc.toString().substring(0, splitIndex).split('{{').pop();

          pickedCompletionConfig.from = from - substring.length;
        }

        const dispatchConfig = {
          changes: pickedCompletionConfig,
        };

        const actualInput = removeNestedDoubleCurlyBraces(doc.toString());

        if (actualInput.length === 0) {
          dispatchConfig.selection = {
            anchor: anchorSelection,
          };
        }

        view.dispatch(dispatchConfig);
      },
    };
  });

  return suggestions;
};

function filterHintsByDepth(input, hints) {
  if (input === '') return hints;

  const inputDepth = input.includes('.') ? input.split('.').length : 0;

  const filteredHints = hints.filter((cm) => {
    const hintParts = cm.hint.split('.');

    let shouldInclude =
      (cm.hint.startsWith(input) && hintParts.length === inputDepth + 1) ||
      (cm.hint.startsWith(input) && hintParts.length === inputDepth);

    const shouldFuzzyMatch = !shouldInclude ? hintParts.length > inputDepth : false;

    if (shouldFuzzyMatch) {
      // fuzzy match
      let matchedDepth = -1;
      for (let i = 0; i < hintParts.length; i++) {
        if (hintParts[i].includes(input)) {
          matchedDepth = i;
          break;
        }
      }

      if (matchedDepth !== -1) {
        shouldInclude = hintParts.length === matchedDepth + 1;
      }
    } else if (input.endsWith('.')) {
      shouldInclude = cm.hint.startsWith(input) && hintParts.length === inputDepth;
    }

    return shouldInclude;
  });

  return filteredHints;
}

export function findNearestSubstring(inputStr, currentCurosorPos) {
  let end = currentCurosorPos - 1; // Adjust for zero-based indexing
  let substring = '';
  const inputSubstring = inputStr.substring(0, end + 1);

  console.log(`Initial cursor position: ${currentCurosorPos}`);
  console.log(`Character at cursor: '${inputStr[end]}'`);
  console.log(`Input substring: '${inputSubstring}'`);

  // Iterate backwards from the character before the cursor
  for (let i = end; i >= 0; i--) {
    if (inputStr[i] === ' ') {
      break; // Stop if a space is found
    }
    substring = inputStr[i] + substring;
  }

  return substring;
}
