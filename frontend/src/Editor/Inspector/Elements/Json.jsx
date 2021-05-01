import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { getToolTipProps } from './utils';

export const Json = ({
  param, definition, onChange, paramType, componentMeta
}) => {
  const value = definition
    ? definition.value
    : `[{
        "id": 1,
        "name": "Sam",
        "email": "hanson@example.com"
      }]`;

  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;      

  return (
    <div className="field mb-2">
      <label {...getToolTipProps(paramMeta)} className="form-label">{displayName}</label>
      <CodeMirror
        height="300px"
        fontSize="2"
        onChange={(instance) => onChange(param, 'value', instance.getValue(), paramType)}
        value={value}
        options={{
          theme: 'duotone-light',
          mode: 'json',
          lineWrapping: true,
          scrollbarStyle: null
        }}
      />
    </div>
  );
};
