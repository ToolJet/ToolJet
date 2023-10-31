import React from 'react';
import './CustomInput.scss';

function index({ value, disabled, staticText, onInputChange }) {
  return (
    <div className="form-text">
      <input
        type="text"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder="width"
        id="youridhere"
        disabled={disabled}
        onChange={(e) => {
          onInputChange(e);
        }}
      />
      <label for="youridhere" className="static-value tj-text-xsm">
        {staticText}
      </label>
    </div>
  );
}

export default index;
