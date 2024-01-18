/* eslint-disable import/no-unresolved */
import React, { useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';

import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';

import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';

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
  } = props;

  const [currentValue, setCurrentValue] = React.useState(() => initialValue);

  const handleChange = React.useCallback((val) => {
    setCurrentValue(val);
  }, []);

  const handleOnBlur = React.useCallback(() => {
    onChange(currentValue);
  }, [currentValue]);

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

  useEffect(() => {
    setCurrentValue(initialValue);
  }, [lang]);

  const heightInPx = typeof height === 'string' && height?.includes('px') ? height : `${height}px`;

  return (
    <div className={className} cyLabel={cyLabel}>
      <CodeMirror
        value={currentValue}
        placeholder={placeholder}
        height={heightInPx}
        // width=''
        theme={theme}
        extensions={[langExtention]}
        onChange={handleChange}
        onBlur={handleOnBlur}
        basicSetup={setupConfig}
      />
    </div>
  );
};

export default MultiLineCodeEditor;
