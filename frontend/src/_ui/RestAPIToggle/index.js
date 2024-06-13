import React from 'react';
import './restapitoggle.scss';
function RestAPIToggle({
  onChange,
  checked = false,
  className = {},
  disabled = false,
  text = '',
  dataCy = '',
  subtext = '',
}) {
  return (
    <div className="rest-api-toggle">
      <label className={`form-check form-switch ${className}`}>
        <input
          className="form-check-input tj-toggle-switch"
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          data-cy={`${dataCy}-toggle-input`}
        />
      </label>
      <div className="tj-text-wrapper">
        <span className="tj-restapi-toggle-text" data-cy={`${dataCy}-toggle-label`}>
          {text}
        </span>
        <span className="tj-restapi-toggle-subtext" data-cy={`${dataCy}-toggle-label`}>
          {subtext}
        </span>
      </div>
    </div>
  );
}
export default RestAPIToggle;
