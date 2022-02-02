import React from 'react';
import FxButton from './FxButton';

export const Number = ({ value, onChange, forceCodeBox }) => {
  return (
    <>
      <div className="row">
        <div className="col-10">
          <div className="field mb-3">
            <label className="form-check form-switch my-2">
              <input type="text" onClick={() => onChange(`{{${value}}}`)} value={value} />
            </label>
          </div>
        </div>
        <div className="col-2 pt-2">
          <FxButton active={false} onPress={forceCodeBox} />
        </div>
      </div>
    </>
  );
};
