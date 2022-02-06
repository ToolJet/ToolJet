import React from 'react';
import { ToolTip } from './Components/ToolTip';
import FxButton from './FxButton';

export const Toggle = ({ value, onChange, paramLabel, forceCodeBox }) => {
  return (
    <div className="row">
      <div className="col-10">
        <div className="field mb-3">
          <label className="form-check form-switch my-2">
            <input
              className="form-check-input"
              type="checkbox"
              onClick={() => onChange(`{{${!value}}}`)}
              checked={value}
            />
            <ToolTip label={paramLabel} meta={{}} labelClass="form-check-label" />
          </label>
        </div>
      </div>
      <div className="col-2 pt-2">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
