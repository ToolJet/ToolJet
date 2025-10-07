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
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import './codeEditor.scss';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

export const CodeEditor = ({
  id,
  height,
  darkMode,
  properties,
  styles,
  setExposedVariable,
  dataCy,
  adjustComponentPositions,
  currentLayout,
  width,
  currentMode,
}) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const { visibility, disabledState } = styles;
  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const [value, setValue] = useState('');

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility,
  });

  const codeChanged = debounce((code) => {
    setExposedVariable('value', code);
  }, 500);

  const editorStyles = {
    height: isDynamicHeightEnabled ? '100%' : height,
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
    return isDynamicHeightEnabled ? 'auto' : height || 'auto';
  }, [height, isDynamicHeightEnabled]);

  useEffect(() => {
    const _setValue = (value) => {
      if (typeof value === 'string') {
        codeChanged(value);
        setValue(value);
      }
    };
    setExposedVariable('setValue', _setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-disabled={disabledState} style={editorStyles} data-cy={dataCy}>
      <div
        className={`code-hinter codehinter-default-input code-editor-widget scrollbar-container`}
        style={{
          height: isDynamicHeightEnabled ? `max(100%, ${height + 1}px)` : height || '100%',
          ...(isDynamicHeightEnabled
            ? { minHeight: height - 1, maxHeight: '100%', overflow: 'auto' }
            : { minHeight: height - 1, maxHeight: '320px', overflow: 'auto' }),
          borderRadius: `${styles.borderRadius}px`,
          boxShadow: styles.boxShadow,
        }}
      >
        <CodeMirror
          value={value}
          placeholder={placeholder}
          height={'100%'}
          minHeight={isDynamicHeightEnabled ? 'none' : editorHeight}
          maxHeight={isDynamicHeightEnabled ? 'none' : editorHeight}
          width="100%"
          theme={theme}
          extensions={[langExtention ?? javascript()]}
          onChange={(value) => {
            setValue(value);
            codeChanged(value);
            setForceDynamicHeightUpdate(!forceDynamicHeightUpdate);
          }}
          basicSetup={setupConfig}
          style={
            {
              // ...(isDynamicHeightEnabled ? {} : { overflowY: 'auto' }),
            }
          }
          className={`codehinter-multi-line-input code-editor-component`}
          indentWithTab={true}
        />
      </div>
    </div>
  );
};
