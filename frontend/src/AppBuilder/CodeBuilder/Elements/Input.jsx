import React from 'react';

export const Input = ({ value, onChange, cyLabel, meta }) => {
  return (
    <div className="form-text">
      <input
        data-cy={`${String(cyLabel)}-input`}
        style={{ width: '142px', height: '32px' }}
        type="text"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder=""
        id="labelId"
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
      <label for="labelId" className="static-value tj-text-xsm">
        {meta.staticText?.length > 0 ? meta.staticText : meta.staticText?.length == 0 ? '' : 'px'}
      </label>
    </div>
  );
};
