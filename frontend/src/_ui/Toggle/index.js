import React from 'react';
import './Toggle.scss';
function Toggle({ onChange, checked = false, className = {}, disabled = false, label = '' }) {
  return (
    <label className={`form-check form-switch ${className}`}>
      <input
        className="form-check-input tj-toggle-switch"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="tj-toggle-label">{label}</span>
    </label>
  );
}
export default Toggle;
