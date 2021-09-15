import React from 'react';

const Radio = ({ checked, disabled, text, helpText, ...props }) => {
  return (
    <label className="form-check mt2">
      <input {...props} className="form-check-input" type="radio" checked={checked} disabled={disabled} />
      <span className="form-check-label">
        {text}{' '}
        {helpText && (
          <>
            <br />
            <small className="text-muted">{helpText}</small>
          </>
        )}
      </span>
    </label>
  );
};

export default Radio;
