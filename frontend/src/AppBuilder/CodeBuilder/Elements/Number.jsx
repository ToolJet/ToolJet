import React, { useState } from 'react';

export const Number = ({ value, onChange, cyLabel }) => {
  const [number, setNumber] = useState(value ? value : 0);

  return (
    <>
      <div className="field tj-app-input" style={{ padding: '0.225rem 0.35rem' }}>
        <input
          className={'inspector-field-number'}
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
