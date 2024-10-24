import React from 'react';
import { ToolTip } from './Components/ToolTip';

export const Toggle = ({ param, definition, onChange, paramType, componentMeta }) => {
  const value = definition?.value !== false ?? false;
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

  return (
    <div className="field mb-3">
      <label className="form-check form-switch my-2">
        <input
          className="form-check-input"
          type="checkbox"
          onClick={() => onChange(param, 'value', !value, paramType)}
          checked={value}
        />
        <ToolTip label={displayName} meta={paramMeta} labelClass="form-check-label" />
      </label>
    </div>
  );
};
