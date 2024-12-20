import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import { getLastDepth, getLastSubstring } from './autocompleteUtils';

export const getAutocompletion = (input, fieldType, hints, totalReferences = 1, originalQueryInput = null) => {
  if (!input.startsWith('{{') || !input.endsWith('}}')) return [];
  if (!hasBalancedBraces(input)) {
    return [];
  }

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

// Helper function to check for balanced braces  - {{}} else dont show suggestions
export function hasBalancedBraces(input) {
  let count = 0;
  for (let char of input) {
    if (char === '{') count++;
    if (char === '}') count--;
    if (count < 0) return false;
  }
  return count === 0;
}

function orderSuggestions(suggestions, validationType) {
  if (!validationType) return suggestions;

  const matchingSuggestions = suggestions.filter((s) => s.detail === validationType);

  const otherSuggestions = suggestions.filter((s) => s.detail !== validationType);

  return [...matchingSuggestions, ...otherSuggestions];
}

/**
 * Applies autocompletion for template expressions in a custom syntax system.
 *
 * This function handles the application of selected autocompletion suggestions
 * within template expressions, typically enclosed in double curly braces {{}}.
 * It's designed to work with both complete and incomplete expressions, providing
 * a flexible autocompletion experience. The function performs the following key tasks:
 *
 * 1. Identifies the current template expression:
 *    - Locates the opening '{{' before the cursor.
 *    - Finds the closing '}}' after the cursor, if it exists.
 *    - Handles cases where the closing braces are missing.
 *
 * 2. Analyzes the current path or word being completed:
 *    - Extracts the text before and after the cursor within the expression.
 *    - Identifies the current path or word that needs completion.
 *
 * 3. Determines the appropriate completion strategy:
 *    - Appends to existing paths if completing after a dot.
 *    - Replaces partial paths if the completion extends the current path.
 *    - Inserts at the cursor position for new additions.
 *
 * 4. Constructs the new content:
 *    - Builds the new expression incorporating the selected completion.
 *    - Preserves existing parts of the expression not affected by the completion.
 *
 * 5. Applies the change:
 *    - Updates the document with the new content.
 *    - Positions the cursor appropriately after the completion.
 *
 * The function is designed to handle various scenarios, including:
 * - Completing nested properties (e.g., "queries.runApp." → "queries.runApp.data")
 * - Partial word completions (e.g., "quer" → "queries")
 * - Insertions in empty or new expressions (e.g., "{{" → "{{queries")
 * - Completions in expressions without closing braces
 *
 * It aims to provide a seamless and intuitive autocompletion experience, respecting
 * the user's input and the structure of the template expression system.
 */
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
        const fullText = doc.toString();
        const cursorPos = view.state.selection.main.head;

        // Find the current template expression
        let exprStart = fullText.lastIndexOf('{{', cursorPos);
        let exprEnd = fullText.indexOf('}}', cursorPos);

        // Handle case where there's no opening brace found
        if (exprStart === -1) {
          exprStart = from; // Use the 'from' position provided by CodeMirror
        }

        // Handle case where there's no closing brace found
        if (exprEnd === -1) {
          exprEnd = fullText.length; // Set to end of document
        }

        // Ensure exprStart and cursorPos are within valid range
        const safeExprStart = Math.max(0, Math.min(exprStart, fullText.length));
        const safeCursorPos = Math.max(0, Math.min(cursorPos, fullText.length));

        // Adjust the substring call with bounds checking
        const beforeCursor = fullText.substring(Math.min(safeExprStart + 2, fullText.length), safeCursorPos);

        const safeExprEnd = Math.max(0, Math.min(exprEnd, fullText.length));
        const afterCursor = fullText.substring(safeCursorPos, safeExprEnd);

        // Use findNearestSubstring to get the current input
        const currentInput = findNearestSubstring(beforeCursor, beforeCursor.length);

        let replaceStart = cursorPos;
        let replaceEnd = cursorPos;

        if (completion.type === 'js_methods') {
          replaceStart = from;
          replaceEnd = to;
        } else {
          const lastIndex = beforeCursor.lastIndexOf(currentInput);
          if (lastIndex !== -1) {
            replaceStart = exprStart + 2 + lastIndex; // +2 to account for '{{'
          } else {
            // If currentInput is not found, set replaceStart to the cursor position
            // This will effectively insert the completion at the cursor
            replaceStart = cursorPos;
          }
          replaceEnd = cursorPos;
        }
        // Create the new content
        let newContent;
        if (completion.type === 'js_methods') {
          const methodName = completion.label.endsWith('()') ? completion.label : completion.label + '()';
          newContent =
            '{{' +
            fullText.substring(exprStart + 2, replaceStart) +
            methodName +
            fullText.substring(replaceEnd, exprEnd);
        } else {
          // Use filterHintsByDepth logic to determine if we should replace or append
          const inputDepth = currentInput.includes('.') ? currentInput.split('.').length : 0;
          const completionParts = completion.label.split('.');

          if (completionParts.length > inputDepth && completion.label.startsWith(currentInput)) {
            // Replace the entire input with the completion
            newContent =
              '{{' +
              fullText.substring(exprStart + 2, replaceStart) +
              completion.label +
              fullText.substring(replaceEnd, exprEnd);
          } else if (currentInput.endsWith('.') || completionParts.length === inputDepth) {
            // Append the completion
            newContent =
              '{{' +
              fullText.substring(exprStart + 2, replaceEnd) +
              completion.label.slice(currentInput.length) +
              fullText.substring(replaceEnd, exprEnd);
          } else {
            // Replace the last part of the input
            const inputParts = currentInput.split('.');
            inputParts[inputParts.length - 1] = completion.label;
            newContent =
              '{{' +
              fullText.substring(exprStart + 2, replaceStart) +
              inputParts.join('.') +
              fullText.substring(replaceEnd, exprEnd);
          }
        }
        // Ensure the expression ends with closing braces if it was originally present

        if (exprEnd >= 0 && exprEnd + 2 <= fullText.length && fullText.substring(exprEnd, exprEnd + 2) === '}}') {
          newContent += '}}';
        }
        // Apply the change
        view.dispatch({
          changes: { from: exprStart, to: exprEnd + 2, insert: newContent },
          selection: { anchor: exprStart + newContent.length - (newContent.endsWith('}}') ? 2 : 0) },
          // ...dispatchConfig
        });
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
