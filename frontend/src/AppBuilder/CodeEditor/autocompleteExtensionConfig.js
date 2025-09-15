/* eslint-disable import/no-unresolved */
import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import { getLastDepth, getLastSubstring } from './autocompleteUtils';
import { syntaxTree } from '@codemirror/language';

/**
 * Collects all unique JS method hints from all field types
 * @param {Object} hints - The hints object containing jsHints
 * @returns {Array} Array of unique JS method hints with type 'js_method'
 */
const collectUniqueJSMethodHints = (hints) => {
  const uniqueHints = new Set();
  Object.values(hints['jsHints']).forEach((fieldType) => {
    fieldType['methods'].forEach((hint) => uniqueHints.add(hint));
  });

  return Array.from(uniqueHints, (hint) => ({
    hint,
    type: 'js_method',
  }));
};

export const getAutocompletion = (input, fieldType, hints, totalReferences = 1, originalQueryInput = null) => {
  if (!input.startsWith('{{') || !input.endsWith('}}')) return [];

  const actualInput = removeNestedDoubleCurlyBraces(input);

  let JSLangHints = [];

  if (fieldType && fieldType !== 'union') {
    //Update here to show better hints for union type
    JSLangHints = hints['jsHints'][fieldType]['methods'].map((hint) => ({
      hint: hint,
      type: 'js_method',
    }));
  } else {
    // Collect all unique JS method hints from all field types
    JSLangHints = collectUniqueJSMethodHints(hints);
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

  const lastCharsAfterDot = actualInput.split('.').pop();
  const jsHints = JSLangHints.filter((cm) => {
    if (cm.hint.includes(lastCharsAfterDot)) return true;
    return false;
  });

  jsHints.sort((a, b) => {
    return a.hint.startsWith(lastCharsAfterDot) ? -1 : 1;
  });

  const searchInput = removeNestedDoubleCurlyBraces(input);
  const suggestions = generateHints(
    [...jsHints, ...autoSuggestionList],
    totalReferences,
    originalQueryInput,
    searchInput
  );

  return suggestions;
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

    let displayLabel = getLastDepth(displayedHint);

    if (type != 'js_method') {
      const currentWordDepth = currentWord.split('.').length;
      displayLabel = hint
        .split('.')
        .slice(currentWordDepth - 1)
        .join('.');
    }

    return {
      displayLabel,
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
          const newFrom = to - searchText.length;
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
  const inputParts = input.split('.');
  const inputDepth = inputParts.length + 1;

  const hintsWithDepth = hints.map((hint) => {
    const hintParts = hint.hint.split('.');
    return {
      ...hint,
      depth: hintParts.length,
    };
  });

  const filteredHints = hintsWithDepth.filter((hint) => {
    return hint.depth <= inputDepth;
  });

  const sortedHints = filteredHints.sort((hint1, hint2) => hint1.depth - hint2.depth);

  return sortedHints;
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

export const getSuggestionsForMultiLine = (context, allHints, hints = {}, lang, paramList = []) => {
  const currentCursor = context.pos;

  const currentString =
    context.state.doc.text ||
    (context.state.doc.children && context.state.doc.children.flatMap((child) => child.text || []));

  const inputStr = currentString.join(' ');
  const currentCurosorPos = currentCursor;
  const nearestSubstring = removeNestedDoubleCurlyBraces(findNearestSubstring(inputStr, currentCurosorPos));

  let JSLangHints = [];
  if (lang === 'javascript') {
    // Collect all unique JS method hints from all field types
    JSLangHints = collectUniqueJSMethodHints(hints);

    JSLangHints = JSLangHints.filter((cm) => {
      let lastWordAfterDot = nearestSubstring.split('.');

      lastWordAfterDot = lastWordAfterDot[lastWordAfterDot.length - 1];

      if (cm.hint.includes(lastWordAfterDot)) return true;
    });
  }

  const appHints = allHints['appHints'];

  let autoSuggestionList = appHints.filter((suggestion) => {
    return suggestion.hint.includes(nearestSubstring);
  });

  const localVariables = new Set();

  // Traverse the syntax tree to extract variable declarations
  syntaxTree(context.state).iterate({
    enter: (node) => {
      // JavaScript: Detect variable declarations (var, let, const)
      if (node.name === 'VariableDefinition') {
        const varName = context.state.sliceDoc(node.from, node.to);
        if (varName && varName.startsWith(nearestSubstring)) localVariables.add(varName);
      }
    },
  });

  // Convert Set to an array of completion suggestions
  const localVariableSuggestions = [...localVariables].map((varName) => ({
    hint: varName,
    type: 'variable',
  }));

  const suggestionList = paramList.filter((paramSuggestion) => paramSuggestion.hint.includes(nearestSubstring));

  const suggestions = generateHints(
    [...localVariableSuggestions, ...JSLangHints, ...autoSuggestionList, ...suggestionList],
    null,
    nearestSubstring
  )
    // Apply depth-based sorting (like SingleLineCodeEditor's filterHintsByDepth)
    .sort((a, b) => {
      // Calculate depth based on the original hint property (not label)
      const aDepth = (a.info?.split('.') || []).length;
      const bDepth = (b.info?.split('.') || []).length;

      // Sort by depth first (shallow suggestions first)
      return aDepth - bDepth;
    })
    .map((hint) => {
      if (hint.label.startsWith('client') || hint.label.startsWith('server')) return;

      delete hint['apply'];

      hint.apply = (view, completion, from, to) => {
        /**
         * This function applies an auto-completion logic to a text editing view based on user interaction.
         * It uses a pre-defined completion object and modifies the document's content accordingly.
         *
         * Parameters:
         * - view: The editor view where the changes will be applied.
         * - completion: An object containing details about the completion to be applied. Includes properties like 'label' (the text to insert) and 'type' (e.g., 'js_methods').
         * - from: The initial position (index) in the document where the completion starts.
         * - to: The position (index) in the document where the completion ends.
         *
         * Logic:
         * - The function calculates the start index for the change by subtracting the length of the word to be replaced (finalQuery) from the 'from' index.
         * - It configures the completion details such as where to insert the text and the exact text to insert.
         * - If the completion type is 'js_methods', it adjusts the insertion point to the 'to' index and sets the cursor position after the inserted text.
         * - Finally, it dispatches these configurations to the editor view to apply the changes.
         *
         * The dispatch configuration (dispacthConfig) includes changes and, optionally, the cursor selection position if the type is 'js_methods'.
         */

        const wordToReplace = nearestSubstring;
        const fromIndex = from - wordToReplace.length;

        const pickedCompletionConfig = {
          from: fromIndex === 1 ? 0 : fromIndex,
          to: to,
          insert: completion.label,
        };

        const dispacthConfig = {
          changes: pickedCompletionConfig,
        };

        if (completion.type === 'js_methods') {
          let limit = Math.max(1, fromIndex === 1 ? 0 : fromIndex);
          for (let i = to; i > limit; i--) {
            if (inputStr[i - 1] === '.') {
              pickedCompletionConfig.from = i;
              break;
            }
          }
          dispacthConfig.selection = {
            anchor: pickedCompletionConfig.from + completion.label.length - 1,
          };
        }

        view.dispatch(dispacthConfig);
      };
      return hint;
    });

  return {
    from: context.pos,
    options: [...suggestions],
    filter: false,
  };
};
