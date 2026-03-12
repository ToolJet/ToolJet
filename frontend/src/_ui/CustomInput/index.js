import React from 'react';
import './CustomInput.scss';

function index({ value, disabled, staticText, onInputChange, type = 'text', dataCy = '', ...props }) {
  return (
    <div className="form-text">
      <input
        data-cy={`${String(dataCy)}-input-field`}
        type={type}
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder="width"
        id="labelId"
        disabled={disabled}
        onChange={(e) => {
          onInputChange(e);
        }}
        {...props}
      />
      <label for="labelId" className="static-value tj-text-xsm">
        {staticText}
      </label>
    </div>
  );
}

export default index;
