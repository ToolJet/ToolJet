import React from 'react';

export const NumberInput = ({ value, onChange, cyLabel, staticText }) => {
  return (
    <div className="form-text tj-number-input-element">
      <input
        style={{ width: '142px', height: '32px' }}
        data-cy={`${String(cyLabel)}-input`}
        type="number"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder=""
        id="labelId"
        onChange={(e) => {
          onChange(e.target.value);
        }}
        autoComplete="off"
      />
      <label for="labelId" className="static-value tj-text-xsm">
        {staticText?.length > 0 ? staticText : staticText?.length == 0 ? '' : 'px'}
      </label>
    </div>
  );
};
