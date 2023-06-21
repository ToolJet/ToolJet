import React, { useEffect } from 'react';
import 'draft-js/dist/Draft.css';
import { DraftEditor } from './DraftEditor';

export const RichTextEditor = function RichTextEditor({
  width,
  height,
  properties,
  styles,
  setExposedVariable,
  dataCy,
  boxShadow,
}) {
  const { visibility, disabledState } = styles;
  const placeholder = properties.placeholder;
  const defaultValue = properties?.defaultValue ?? '';

  // exposing the default value at first
  useEffect(() => {
    setExposedVariable('value', defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(html) {
    setExposedVariable('value', html);
  }

  return (
    <div
      data-disabled={disabledState}
      style={{ height: `${height}px`, display: visibility ? '' : 'none', boxShadow }}
      data-cy={dataCy}
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
