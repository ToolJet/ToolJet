/* eslint-disable import/no-unresolved */
import React, { useState, useEffect } from 'react';
import { useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import CodeMirror from '@uiw/react-codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { sass } from '@codemirror/lang-sass';
import { debounce } from 'lodash';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { EditorView } from '@codemirror/view';
import './codeEditor.scss';

const langSupport = Object.freeze({
  javascript: javascript(),
  python: python(),
  sql: sql(),
  jsx: javascript({ jsx: true }),
  css: sass(),
});

const lineWrappingExtension = EditorView.lineWrapping;

const CodeEditor = ({
  id,
  height,
  darkMode,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  dataCy,
  currentLayout,
  width,
  currentMode,
  subContainerIndex,
  componentType,
}) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const { visibility, disabledState } = properties;
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const [value, setValue] = useState('');

  // A changed Visibility / Disable property wins over an earlier setVisibility / setDisable call.
  useEffect(() => {
    setIsVisible(visibility);
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setIsDisabled(disabledState);
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        setIsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    currentLayout,
    width,
    visibility: isVisible,
    subContainerIndex,
    componentType,
  });

  const codeChanged = debounce((code) => {
    setExposedVariable('value', code);
  }, 500);

  const updateValue = (val) => {
    setValue(val);
    setForceDynamicHeightUpdate((prev) => !prev);
    codeChanged(val);
  };

  const editorStyles = {
    height: isDynamicHeightEnabled ? '100%' : height,
    display: !isVisible ? 'none' : 'block',
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
        setForceDynamicHeightUpdate((prev) => !prev);
      }
    };
    setExposedVariable('setValue', _setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFormClear(() => updateValue(''));

  return (
    <div data-disabled={isDisabled} style={editorStyles} data-cy={dataCy}>
      <div
        className={`code-hinter codehinter-default-input code-editor-widget scrollbar-container`}
        style={{
          height: isDynamicHeightEnabled ? '100%' : height || '100%',
          ...(isDynamicHeightEnabled
            ? { minHeight: height - 1, maxHeight: '100%', overflow: 'auto' }
            : { minHeight: height - 1, maxHeight: '320px', overflow: 'auto' }),
          borderRadius: `${styles.borderRadius}px`,
          boxShadow: styles.boxShadow,
          border: `1px solid ${styles.borderColor}`,
          '--cc-code-editor-min-height': `${height - 1}px`,
          '--cc-code-editor-background-color': styles.backgroundColor,
        }}
      >
        <CodeMirror
          value={value}
          placeholder={placeholder}
          height={'100%'}
          minHeight={isDynamicHeightEnabled ? `${height}px` : editorHeight}
          maxHeight={isDynamicHeightEnabled ? 'none' : editorHeight}
          width="100%"
          theme={theme}
          extensions={[langExtention ?? javascript(), lineWrappingExtension]}
          onChange={updateValue}
          basicSetup={setupConfig}
          className={`codehinter-multi-line-input code-editor-component`}
          indentWithTab={true}
          editable={!isDisabled}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
