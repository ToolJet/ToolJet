import React from 'react';
import { Editor, EditorState } from "draft-js";
import "draft-js/dist/Draft.css";
import { DraftEditor } from './DraftEditor';

export const RichTextEditor = function RichTextEditor({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState,
  onComponentOptionChanged
}) {

  const placeholder = component.definition.properties.placeholder.value;

  function handleChange(html) {
    onComponentOptionChanged(component, 'value', html);
  }

  return (
    <div style={{ width: `${width}px`, height: `${height}px` }} onClick={event => {event.stopPropagation(); onComponentClick(id, component)}}>
      <DraftEditor
        handleChange={handleChange}
        height={height}
        width={width}
        placeholder={placeholder}
      ></DraftEditor>
    </div>
  );
};
