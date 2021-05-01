import React from 'react';
import { getToolTipProps } from './utils';

export const Text = ({
  param, definition, onChange, paramType, componentMeta
}) => {
  const value = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;
  
  return (
    <div className="field mb-3">
      <label {...getToolTipProps(paramMeta)} className="form-label">{displayName}</label>
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
