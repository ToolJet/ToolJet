/* eslint-disable import/no-unresolved */
import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { sass } from '@codemirror/lang-sass';
import { debounce } from 'lodash';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

export const CodeEditor = ({ id, height, darkMode, properties, styles, setExposedVariable, dataCy }) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const { visibility, disabledState } = styles;
  const [value, setValue] = useState('');

  const codeChanged = debounce((code) => {
    setExposedVariable('value', code);
    setValue(code);
  }, 500);

  const editorStyles = {
    height: height,
    display: !visibility ? 'none' : 'block',
  };

  const setupConfig = {
    lineNumbers: enableLineNumber ?? true,
    syntaxHighlighting: true,
    bracketMatching: true,
    foldGutter: true,
    highlightActiveLine: false,
    autocompletion: true,
    highlightActiveLineGutter: false,
    completionKeymap: true,
    searchKeymap: false,
  };

  const theme = darkMode ? okaidia : githubLight;
  const langExtention = langSupport?.[mode?.toLowerCase()];

  const editorHeight = React.useMemo(() => {
    return height || 'auto';
  }, [height]);

  useEffect(() => {
    const _setValue = (value) => {
      if (typeof value === 'string') {
        codeChanged(value);
      }
    };
    setExposedVariable('setValue', _setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-disabled={disabledState} style={editorStyles} data-cy={dataCy}>
      <div
        className={`code-hinter codehinter-default-input code-editor-widget`}
        style={{
          height: height || 'auto',
          minHeight: height - 1,
          // maxHeight: '320px',
          overflow: 'auto',
          borderRadius: `${styles.borderRadius}px`,
          boxShadow: styles.boxShadow,
        }}
      >
        <CodeMirror
          value={value}
          placeholder={placeholder}
          height={'100%'}
          minHeight={editorHeight}
          maxHeight="100%"
          width="100%"
          theme={theme}
          extensions={langExtention ? [langExtention] : undefined}
          onChange={codeChanged}
          basicSetup={setupConfig}
          style={{
            overflowY: 'auto',
          }}
          className={`codehinter-multi-line-input`}
          indentWithTab={true}
        />
      </div>
    </div>
  );
};
