import React from 'react';
import './CustomInput.scss';

function index({ value, disabled, staticText, onInputChange, dataCy = '' }) {
  return (
    <div className="form-text">
      <input
        data-cy={`${String(dataCy)}-input-field`}
        type="text"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder="width"
        id="labelId"
        disabled={disabled}
        onChange={(e) => {
          onInputChange(e);
        }}
      />
      <label for="labelId" className="static-value tj-text-xsm">
        {staticText}
      </label>
    </div>
  );
}

export default index;
