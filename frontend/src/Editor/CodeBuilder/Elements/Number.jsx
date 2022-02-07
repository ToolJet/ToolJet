import React, { useState } from 'react';
import FxButton from './FxButton';

export const Number = ({ value, onChange, forceCodeBox }) => {
  const [number, setNumber] = useState(value ? value : 0);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const numberTheme = {
    backgroundColor: 'transparent',
    border: 'none',
    color: darkMode && '#fff',
    padding: '0.18rem 0.75rem',
  };
  return (
    <>
      <div className="row">
        <div className="col-10">
          <div className="field mb-3 form-control">
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
        <div className="col-2 pt-2">
          <FxButton active={false} onPress={forceCodeBox} />
        </div>
      </div>
    </>
  );
};
