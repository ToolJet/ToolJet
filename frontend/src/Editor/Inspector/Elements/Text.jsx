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
        onChange={(e) => onChange(param, 'value', e.target.value, paramType)}
        className="form-control text-field"
        name=""
        value={value}
      />
    </div>
  );
};
