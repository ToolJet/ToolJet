import React, { useEffect, useState } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
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

export const CodeEditor = ({ width, height, component, currentState, onComponentOptionChanged, darkMode }) => {
  const enableLineNumber = component.definition.properties?.enableLineNumber?.value ?? true;
  const languageMode = component.definition.properties.mode.value;
  const placeholder = component.definition.properties.placeholder.value;

  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;
  const parsedWidgetVisibility =
    typeof widgetVisibility !== 'boolean' ? resolveWidgetFieldValue(widgetVisibility, currentState) : widgetVisibility;

  const parsedEnableLineNumber =
    typeof enableLineNumber !== 'boolean' ? resolveWidgetFieldValue(enableLineNumber, currentState) : enableLineNumber;

  const value = currentState?.components[component?.name]?.value;

  const [editorValue, setEditorValue] = useState(value);
  const [realState, setRealState] = useState(currentState);

  function codeChanged(code) {
    setEditorValue(code);
    onComponentOptionChanged(component, 'value', code);
  }

  const styles = {
    width: width,
    height: height,
    display: !parsedWidgetVisibility ? 'none' : 'block',
  };
  const options = {
    lineNumbers: parsedEnableLineNumber,
    lineWrapping: true,
    singleLine: true,
    mode: languageMode,
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
    <div data-disabled={parsedDisabledState} style={styles}>
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
