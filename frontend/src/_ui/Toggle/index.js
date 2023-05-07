import React from 'react';
import './Toggle.scss';
function Toggle({ onChange, checked = false, className = {}, disabled = false, label = '', dataCy = '' }) {
  return (
    <label className={`form-check form-switch ${className}`}>
      <input
        className="form-check-input tj-toggle-switch"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-cy={`${dataCy}-toggle-input`}
      />
      <span className="tj-toggle-label" data-cy={`${dataCy}-toggle-label`}>
        {label}
      </span>
    </label>
  );
}
export default Toggle;
