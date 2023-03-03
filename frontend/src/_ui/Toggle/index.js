import React from 'react';
import './Toggle.scss';
function Toggle({ onChange, checked = false, className = {}, disabled = false, label = '' }) {
  return (
    <>
      {/* <Form>
        <Form.Check
          type="switch"
          id="custom-switch"
          label={label}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className={className}
        />
        
      </Form> */}
      <label className="form-check form-switch">
        <input className="form-check-input tj-toggle-switch" type="checkbox" checked={checked} onChange={onChange} />
        <span className="tj-toggle-label">{label}</span>
      </label>
    </>
  );
}
export default Toggle;
