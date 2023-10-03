import React from 'react';

export const Toggle = ({ value, onChange, cyLabel }) => {
  return (
    <div className="row fx-container">
      <div className="col d-flex align-items-center">
        <div className="field">
          <label
            className="form-check form-switch mb-0 d-flex justify-content-end"
            style={{ marginBottom: '0px', paddingLeft: '28px' }}
          >
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
