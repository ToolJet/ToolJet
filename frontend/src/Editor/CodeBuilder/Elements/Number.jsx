import React, { useState } from 'react';
import FxButton from './FxButton';

export const Number = ({ value, onChange, forceCodeBox }) => {
  const [number, setNumber] = useState(value ? value : 0);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const numberTheme = {
    backgroundColor: 'transparent',
    border: 'none',
    color: darkMode && '#fff',
  };
  return (
    <>
      <div className="row fx-container">
        <div className="col">
          <div className="field form-control" style={{ padding: '0.225rem 0.35rem' }} data-cy="border-radius-input">
            <input
              style={numberTheme}
              type="text"
              onChange={(e) => {
                setNumber(e.target.value);
                onChange(`{{${e.target.value}}}`);
              }}
              value={number}
            />
          </div>
        </div>
        <div className="col-auto pt-2 style-fx fx-common">
          <FxButton active={false} onPress={forceCodeBox} />
        </div>
      </div>
    </>
  );
};
