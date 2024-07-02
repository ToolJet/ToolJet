import React from 'react';
import './Toggle.scss';
function Toggle({
  onChange,
  checked = false,
  className = {},
  disabled = false,
  label = '',
  text = '',
  subtext = '',
  dataCy = '',
}) {
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
      {label && (
        <span className="tj-toggle-label" data-cy={`${dataCy}-toggle-label`}>
          {label}
        </span>
      )}
      <div className="text-wrappers">
        {text && (
          <span className="tj-toggle-text" data-cy={`${dataCy}-toggle-text`}>
            {text}
          </span>
        )}
        {subtext && (
          <span className="tj-toggle-subtext" data-cy={`${dataCy}-toggle-subtext`}>
            {subtext}
          </span>
        )}
      </div>
    </label>
  );
}
export default Toggle;
