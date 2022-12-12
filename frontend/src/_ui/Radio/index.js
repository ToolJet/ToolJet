import React from 'react';

const Radio = ({ checked, disabled, text, helpText, ...props }) => {
  return (
    <label className="form-check mt2">
      <input
        {...props}
        className="form-check-input"
        type="radio"
        checked={checked}
        disabled={disabled}
        data-cy={`${String(text).toLocaleLowerCase().replace(/\s+/g, '-')}-input`}
      />
      <span data-cy={`${String(text).toLocaleLowerCase().replace(/\s+/g, '-')}-label`} className="form-check-label">
        {text}{' '}
        {helpText && (
          <>
            <br />
            <small
              className="text-muted"
              data-cy={`${String(text).toLocaleLowerCase().replace(/\s+/g, '-')}-sub-label`}
            >
              {helpText}
            </small>
          </>
        )}
      </span>
    </label>
  );
};

export default Radio;
