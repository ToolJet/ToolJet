export const getAutocompletion = (input, fieldType, hints) => {
  if (!input.startsWith('{{') || !input.endsWith('}}')) return [];

  const actualInput = input.replace(/{{|}}/g, '');

  let JSLangHints = [];

  if (fieldType) {
    JSLangHints = hints['jsHints'][fieldType]['methods'].map((hint) => ({
      hint: hint,
      type: 'js_method',
    }));
  } else {
    // add all js methods
    JSLangHints = Object.keys(hints['jsHints'])
      .map((key) => {
        return hints['jsHints'][key]['methods'].map((hint) => ({
          hint: hint,
          type: 'js_method',
        }));
      })
      .flat();
  }

  const appHints = hints['appHints'].filter((cm) => {
    const { hint } = cm;

    if (hint.includes('actions')) {
      return false;
    }

    const lastChar = hint[cm.length - 1];
    if (lastChar === ')') {
      return false;
    }

    return true;
  });

  const jsHints = JSLangHints.filter((cm) => {
    const lastCharsAfterDot = actualInput.split('.').pop();
    if (cm.hint.includes(lastCharsAfterDot)) return true;
  });

  const autoSuggestionList = appHints.filter((suggestion) => {
    if (actualInput.length === 0) return true;

    return suggestion.hint.includes(actualInput);
  });

  const suggestions = generateHints([...jsHints, ...filterHintsByDepth(actualInput, autoSuggestionList)]);
  return orderSuggestions(suggestions, fieldType).map((cm, index) => ({ ...cm, boost: 100 - index }));
};

function orderSuggestions(suggestions, validationType) {
  if (!validationType) return suggestions;

  const matchingSuggestions = suggestions.filter((s) => s.type === validationType);

  const otherSuggestions = suggestions.filter((s) => s.type !== validationType);

  return [...matchingSuggestions, ...otherSuggestions];
}

export const generateHints = (hints) => {
  if (!hints) return [];

  const suggestions = hints.map(({ hint, type }) => {
    return {
      label: hint,
      type: type === 'js_method' ? 'js_methods' : type?.toLowerCase(),
      section: type === 'js_method' ? { name: 'JS methods', rank: 2 } : { name: 'Suggestions', rank: 1 },
      detail: type === 'js_method' ? 'method' : type?.toLowerCase() || '',
      apply: (view, completion, from, to) => {
        const doc = view.state.doc;

        const { from: start, to: end } = doc.lineAt(from);

        const word = doc.sliceString(start, end);

        const wordStart = start + word.indexOf('{{');

        const wordEnd = wordStart + word.length;

        const pickedCompletionConfig = {
          from: wordEnd - from,
          to: to,
          insert: completion.label,
        };

        if (completion.type === 'js_methods') {
          pickedCompletionConfig.from = from;
        }

        view.dispatch({
          changes: pickedCompletionConfig,
        });
      },
    };
  });

  return suggestions;
};

function filterHintsByDepth(input, hints) {
  const inputDepth = input.split('.').length;
  const filteredHints = hints.filter((cm) => {
    const hintParts = cm.hint.split('.');
    return cm.hint.startsWith(input) && hintParts.length === inputDepth + 1;
  });
  return filteredHints;
}
