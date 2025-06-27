import React, { useEffect, useState } from 'react';

export const Number = ({ value, onChange, cyLabel }) => {
  const [number, setNumber] = useState(value ? value : 0);

  useEffect(() => {
    setNumber(value);
  }, [value]);

  return (
    <>
      <div className="field tj-app-input" style={{ padding: '0.225rem 0.35rem' }}>
        <input
          className={'inspector-field-number'}
          key={`${String(cyLabel)}-input`}
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
