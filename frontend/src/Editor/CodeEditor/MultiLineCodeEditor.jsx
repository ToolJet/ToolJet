/* eslint-disable import/no-unresolved */
import React, { useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { generateHints, getAutocompletion } from './autocompleteExtensionConfig';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
});

const MultiLineCodeEditor = (props) => {
  const {
    darkMode,
    height,
    width,
    initialValue,
    lang,
    className,
    onChange,
    componentName,
    cyLabel,
    currentState,
    lineNumbers,
    placeholder,
    hideSuggestion,
    suggestions: hints,
  } = props;

  const [currentValue, setCurrentValue] = React.useState(() => initialValue);

  const handleChange = React.useCallback((val) => {
    setCurrentValue(val);
  }, []);

  const handleOnBlur = React.useCallback(() => {
    onChange(currentValue);
  }, [currentValue]);

  useEffect(() => {
    setCurrentValue(initialValue);
  }, [lang]);

  const heightInPx = typeof height === 'string' && height?.includes('px') ? height : `${height}px`;

  const theme = darkMode ? okaidia : githubLight;
  const langExtention = langSupport[lang] ?? null;

  const setupConfig = {
    lineNumbers: lineNumbers ?? true,
    syntaxHighlighting: true,
    bracketMatching: true,
    foldGutter: true,
    highlightActiveLine: false,
    autocompletion: hideSuggestion ?? true,
  };

  function autoCompleteExtensionConfig(context) {
    let JSLangHints = [];
    if (lang === 'javascript') {
      JSLangHints = Object.keys(hints['jsHints'])
        .map((key) => {
          return hints['jsHints'][key]['methods'].map((hint) => ({
            hint: hint,
            type: 'js_method',
          }));
        })
        .flat();
    }

    const appHints = hints['appHints'];

    const suggestions = generateHints([...JSLangHints, ...appHints]).map((hint) => {
      delete hint['apply'];

      return hint;
    });

    return {
      from: context.pos,
      options: [...suggestions],
    };
  }

  const autoCompleteConfig = autocompletion({
    override: [autoCompleteExtensionConfig],
    compareCompletions: (a, b) => {
      return a.label < b.label ? -1 : 1;
    },
    aboveCursor: false,
    defaultKeymap: true,
  });

  return (
    <div className={className} cyLabel={cyLabel}>
      <CodeMirror
        value={currentValue}
        placeholder={placeholder}
        height={heightInPx}
        // width=''
        theme={theme}
        extensions={[langExtention, autoCompleteConfig]}
        onChange={handleChange}
        onBlur={handleOnBlur}
        basicSetup={setupConfig}
      />
    </div>
  );
};

export default MultiLineCodeEditor;
