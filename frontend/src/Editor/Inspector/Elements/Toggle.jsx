import React from 'react';
import { getToolTipProps } from './utils';

export const Toggle = ({
  param, definition, onChange, paramType, componentMeta
}) => {
  const value = definition ? definition.value : false;
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
            <span {...getToolTipProps(paramMeta)} className="form-check-label">
                {displayName}
            </span>
        </label>
    </div>
  );
};
