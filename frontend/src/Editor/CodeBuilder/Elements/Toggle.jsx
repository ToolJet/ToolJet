import React from 'react';
import { ToolTip } from './Components/ToolTip';

export const Toggle = ({ value, onChange, paramLabel }) => {
  console.log({ value });
  return (
    <div className="field mb-3">
      <label className="form-check form-switch my-2">
        <input className="form-check-input" type="checkbox" onClick={() => onChange(!value)} checked={value} />
        <ToolTip label={paramLabel} meta={{}} labelClass="form-check-label" />
      </label>
    </div>
  );
};
