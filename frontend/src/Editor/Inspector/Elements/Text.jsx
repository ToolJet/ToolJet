import React from 'react';
import { ToolTip } from './Components/ToolTip';

export const Text = ({
  param, definition, onChange, paramType, componentMeta
}) => {
  const value = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;
  
  return (
    <div className="field mb-3">
      <ToolTip label={displayName} meta={paramMeta}/>
      <input
        type="text"
        onBlur={(e) => onChange(param, 'value', e.target.value, paramType)}
        onKeyDown={(e) => {
          if(e.key === 'Enter') {
            onChange(param, 'value', e.target.value, paramType)
          }
        }}
        className="form-control text-field"
        name=""
        defaultValue={value}
      />
    </div>
  );
};
