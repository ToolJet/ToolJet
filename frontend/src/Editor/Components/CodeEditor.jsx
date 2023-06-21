import React from 'react';
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
  height,
  darkMode,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  dataCy,
  boxShadow,
}) => {
  const { enableLineNumber, mode, placeholder } = properties;
  const { visibility, disabledState } = styles;

  function codeChanged(code) {
    setExposedVariable('value', code);
  }

  const editorStyles = {
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
  }

  return (
    <div data-disabled={disabledState} style={editorStyles} data-cy={dataCy}>
      <div
        className={`code-hinter codehinter-default-input code-editor-widget`}
        style={{
          height: height || 'auto',
          minHeight: height - 1,
          maxHeight: '320px',
          overflow: 'auto',
          borderRadius: `${styles.borderRadius}px`,
          boxShadow,
        }}
      >
        <CodeMirror
          value={exposedVariables.value}
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
