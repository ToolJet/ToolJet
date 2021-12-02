import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/monokai.css';
import { onBeforeChange, handleChange } from '../CodeBuilder/utils';

export const CodeEditor = ({
  width,
  height,
  component,
  currentState,
  darkMode,
  properties,
  styles,
  setExposedVariable,
}) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const { visibility, disabledState } = styles;

  const value = currentState?.components[component?.name]?.value;

  const [editorValue, setEditorValue] = useState(value);
  const [realState, setRealState] = useState(currentState);

  function codeChanged(code) {
    setEditorValue(code);
    setExposedVariable('value', code);
  }

  const editorStyles = {
    width: width,
    height: height,
    display: !visibility ? 'none' : 'block',
  };
  const options = {
    lineNumbers: enableLineNumber,
    lineWrapping: true,
    singleLine: true,
    mode: mode,
    tabSize: 2,
    theme: darkMode ? 'monokai' : 'duotone-light',
    readOnly: false,
    highlightSelectionMatches: true,
    placeholder,
  };

  function valueChanged(editor, onChange, ignoreBraces = false) {
    handleChange(editor, onChange, [], ignoreBraces);
    setEditorValue(editor.getValue());
  }

  useEffect(() => {
    setRealState(currentState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  return (
    <div data-disabled={disabledState} style={editorStyles}>
      <div
        className={`code-hinter codehinter-default-input code-editor-widget`}
        style={{ height: height || 'auto', minHeight: height - 1, maxHeight: '320px', overflow: 'auto' }}
      >
        <CodeMirror
          value={editorValue}
          realState={realState}
          scrollbarStyle={null}
          height={height - 1}
          onBlur={(editor) => {
            const value = editor.getValue();
            codeChanged(value);
          }}
          onChange={(editor) => valueChanged(editor, codeChanged)}
          onBeforeChange={(editor, change) => onBeforeChange(editor, change)}
          options={options}
        />
      </div>
    </div>
  );
};
