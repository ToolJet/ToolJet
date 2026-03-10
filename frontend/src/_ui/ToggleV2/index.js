import React from 'react';
import './ToggleV2.scss';

function ToggleV2({
  onChange,
  checked = false,
  className = '',
  disabled = false,
  label = '',
  helpText = '',
  dataCy = '',
}) {
  return (
    <label
      className={`form-check form-switch tj-toggle-v2 ${className}`}
      data-cy={`${dataCy}-toggle-wrapper`}
    >
      {/* Toggle Switch */}
      <input
        className="form-check-input tj-toggle-switch"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-cy={`${dataCy}-toggle-input`}
      />

      {/* Text Section */}
      <div className="text-wrappers">
        {label && (
          <span
            className="tj-toggle-v2-label"
            data-cy={`${dataCy}-toggle-label`}
          >
            {label}
          </span>
        )}

        {helpText && (
          <span
            className="tj-toggle-v2-helptext"
            data-cy={`${dataCy}-toggle-helptext`}
          >
            {helpText}
          </span>
        )}
      </div>
    </label>
  );
}

export default ToggleV2;