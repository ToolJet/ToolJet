import React, { useState } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { CodeHinter } from '../CodeBuilder/CodeHinter';

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

  function codeChanged(code) {
    setEditorValue(code);
    onComponentOptionChanged(component, 'value', code);
  }

  const styles = {
    width: width,
    height: height,
    display: !parsedWidgetVisibility ? 'none' : 'block',
  };

  console.log('component', JSON.stringify(currentState));
  return (
    <div data-disabled={parsedDisabledState} style={styles} className="container p-1">
      <CodeHinter
        placeholder={placeholder}
        currentState={currentState}
        height={height}
        initialValue={editorValue}
        theme={darkMode ? 'monokai' : 'duotone-light'}
        lineNumbers={parsedEnableLineNumber}
        className="query-hinter, mb-1"
        ignoreBraces={true}
        onChange={(value) => codeChanged(value)}
        mode={languageMode}
        enablePreview={true}
      />
    </div>
  );
};
