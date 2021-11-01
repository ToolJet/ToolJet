import React from 'react';
import 'draft-js/dist/Draft.css';
import { DraftEditor } from './DraftEditor';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const RichTextEditor = function RichTextEditor({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
}) {
  const placeholder = component.definition.properties.placeholder.value;
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const defaultValue = component.definition.properties?.defaultValue?.value ?? '';

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  function handleChange(html) {
    onComponentOptionChanged(component, 'value', html);
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      style={{ width: `${width}px`, height: `${height}px`, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
    >
      <DraftEditor
        handleChange={handleChange}
        height={height}
        width={width}
        placeholder={placeholder}
        defaultValue={defaultValue}
      ></DraftEditor>
    </div>
  );
};
