import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';

export const Json = ({ value, onChange }) => {
  const jsonValue = value
    ? value
    : `[{
        "id": 1,
        "name": "Sam",
        "email": "hanson@example.com"
      }]`;

  return (
    <div className="field mb-2">
      <CodeMirror
        height="300px"
        fontSize="2"
        onChange={(instance) => onChange(instance.getValue())}
        value={jsonValue}
        options={{
          theme: 'duotone-light',
          mode: 'json',
          lineWrapping: true,
          scrollbarStyle: null,
        }}
      />
    </div>
  );
};
