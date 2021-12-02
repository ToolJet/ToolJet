import React from 'react';
import 'draft-js/dist/Draft.css';
import { DraftEditor } from './DraftEditor';

export const RichTextEditor = function RichTextEditor({ width, height, properties, styles, setExposedVariable }) {
  const { visibility, disabledState } = styles;
  const placeholder = properties.placeholder;
  const defaultValue = properties?.defaultValue ?? '';

  function handleChange(html) {
    setExposedVariable('value', html);
  }

  return (
    <div data-disabled={disabledState} style={{ height: `${height}px`, display: visibility ? '' : 'none' }}>
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
