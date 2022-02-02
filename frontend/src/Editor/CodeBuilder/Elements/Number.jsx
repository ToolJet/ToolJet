import React, { useState } from 'react';
import FxButton from './FxButton';

export const Number = ({ value, onChange, forceCodeBox }) => {
  const [number, setNumber] = useState(value);

  return (
    <>
      <div className="row">
        <div className="col-10">
          <div className="field mb-3">
            <label className="form-check form-switch my-2">
              <input
                type="text"
                onChange={(e) => {
                  setNumber(e.target.value);
                  onChange(`{{${e.target.value}}}`);
                }}
                value={number}
              />
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
