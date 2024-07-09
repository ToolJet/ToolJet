import React from 'react';

export const Toggle = ({ value, onChange, cyLabel, meta }) => {
  return (
    <div className="row fx-container">
      <div className="col d-flex align-items-center">
        <div className="field">
          <label
            className="form-check form-switch mb-0 d-flex justify-content-end"
            style={{ marginBottom: '0px', paddingLeft: '28px' }}
          >
            {meta?.toggleLabel && (
              <span
                className="font-weight-400 font-size-12 d-flex align-items-center color-slate12"
                style={{ marginRight: '78px' }}
              >
                {meta?.toggleLabel}
              </span>
            )}
            <input
              className="form-check-input"
              type="checkbox"
              onClick={() => onChange(`{{${!value}}}`)}
              checked={value}
              data-cy={`${cyLabel}-toggle-button`}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
