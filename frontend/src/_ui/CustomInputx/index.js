import React from 'react';
import './CustomInput.scss';

function index({ value, disabled, staticText, onInputChange }) {
  return (
    <div className="form-text custom-texinput-inspector">
      <input
        style={{ width: '142px', height: '32px', paddingRight: '85px' }}
        type="text"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder="width"
        id="custom-inspector-input"
        disabled={disabled}
        onChange={(e) => {
          onInputChange(e);
        }}
      />
      <label for="custom-inspector-input" className="static-value tj-text-xsm">
        {staticText}
      </label>
    </div>
  );
}

export default index;
