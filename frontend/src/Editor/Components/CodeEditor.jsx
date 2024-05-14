/* eslint-disable import/no-unresolved */
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { sass } from '@codemirror/lang-sass';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

export const CodeEditor = ({ height, darkMode, properties, styles, exposedVariables, setExposedVariable, dataCy }) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const { visibility, disabledState } = styles;

  function codeChanged(code) {
    setExposedVariable('value', code);
  }

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
  const langExtention = langSupport[mode?.toLowerCase()] ?? null;

  const editorHeight = React.useMemo(() => {
    return height || 'auto';
  }, [height]);

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
          value={exposedVariables.value}
          placeholder={placeholder}
          height={'100%'}
          minHeight={editorHeight}
          maxHeight="100%"
          width="100%"
          theme={theme}
          extensions={[langExtention]}
          onChange={codeChanged}
          onBlur={(value) => codeChanged(value)}
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
