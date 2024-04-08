export const getAutocompletion = (input, fieldType, hints, totalReferences = 1) => {
  if (!input.startsWith('{{') || !input.endsWith('}}')) return [];

  const actualInput = input.replace(/{{|}}/g, '');
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

  const appHints = hints['appHints'].filter((cm) => {
    const { hint } = cm;

    if (hint.includes('actions') || hint.endsWith('run()')) {
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

  const suggestions = generateHints([...jsHints, ...autoSuggestionList], totalReferences);
  return orderSuggestions(suggestions, fieldType).map((cm, index) => ({ ...cm, boost: 100 - index }));
};

function orderSuggestions(suggestions, validationType) {
  if (!validationType) return suggestions;

  const matchingSuggestions = suggestions.filter((s) => s.detail === validationType);

  const otherSuggestions = suggestions.filter((s) => s.detail !== validationType);

  return [...matchingSuggestions, ...otherSuggestions];
}

export const generateHints = (hints, totalReferences = 1) => {
  if (!hints) return [];

  const suggestions = hints.map(({ hint, type }) => {
    let displayedHint = type === 'js_method' ? `${hint}()` : hint;

    const maxHintLength = 20;
    const hintLength = displayedHint.length;
    const _hint =
      displayedHint.length > maxHintLength ? '...' + displayedHint.slice(hintLength - maxHintLength) : displayedHint;

    return {
      displayLabel: _hint,
      label: displayedHint,
      type: type === 'js_method' ? 'js_methods' : type?.toLowerCase(),
      section: type === 'js_method' ? { name: 'JS methods', rank: 2 } : { name: 'Suggestions', rank: 1 },
      detail: type === 'js_method' ? 'method' : type?.toLowerCase() || '',
      apply: (view, completion, from, to) => {
        const doc = view.state.doc;
        const { from: _, to: end } = doc.lineAt(from);

        const pickedCompletionConfig = {
          from: end - to,
          to: to,
          insert: completion.label,
        };

        let anchorSelection = pickedCompletionConfig.insert.length + 2;

        if (completion.type === 'js_methods') {
          pickedCompletionConfig.from = from;
        }

        if (totalReferences > 1 && completion.type !== 'js_methods') {
          let queryInput = view.state.doc.toString();
          const currentWord = queryInput.split('{{').pop().split('}}')[0];
          pickedCompletionConfig.from = from !== to ? from : from - currentWord.length;

          anchorSelection = queryInput.length + currentWord.length;
        }

        const dispatchConfig = {
          changes: pickedCompletionConfig,
        };

        const actualInput = doc.toString().replace(/{{|}}/g, '');

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

  const inputDepth = input.split('.').length;

  if (inputDepth === 1) {
    return findRelativeHints(input, hints);
  }

  const filteredHints = hints.filter((cm) => {
    const hintParts = cm.hint.split('.');

    let shouldInclude = cm.hint.startsWith(input) && hintParts.length === inputDepth + 1;

    if (input.endsWith('.')) {
      shouldInclude = cm.hint.startsWith(input) && hintParts.length === inputDepth;
    }

    return shouldInclude;
  });
  return filteredHints;
}

function findRelativeHints(input, hints) {
  const filteredHints = hints.filter(({ hint }) => {
    return hint.includes(input);
  });

  return filteredHints;
}
