import React, { useState } from 'react';

export const Number = ({ value, onChange, cyLabel }) => {
  const [number, setNumber] = useState(value ? value : 0);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const numberTheme = {
    backgroundColor: 'transparent',
    border: 'none',
    color: darkMode && '#fff',
    width: '8.063rem', //129px
  };
  return (
    <>
      <div className="field form-control" style={{ padding: '0.225rem 0.35rem' }}>
        <input
          style={numberTheme}
          type="number"
          onChange={(e) => {
            setNumber(e.target.value);
            onChange(`{{${e.target.value}}}`);
          }}
          value={number}
          data-cy={`${String(cyLabel)}-input-field`}
        />
      </div>
    </>
  );
};
