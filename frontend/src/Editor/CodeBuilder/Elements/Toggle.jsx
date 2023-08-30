import React from 'react';

export const Toggle = ({ value, onChange, cyLabel }) => {
  return (
    <div className="row fx-container">
      <div className="col d-flex align-items-center">
        {/* <div className="col-auto pt-0 fx-common">
          <FxButton active={false} onPress={forceCodeBox} dataCy={cyLabel} />
        </div> */}
        <div className="field">
          <label className="form-check form-switch mb-0 d-flex justify-content-end" style={{ marginBottom: '0px' }}>
            <input
              className="form-check-input"
              type="checkbox"
              onClick={() => onChange(`{{${!value}}}`)}
              checked={value}
              data-cy={`${cyLabel}-toggle-button`}
            />
            {/* <ToolTip label={paramLabel} meta={{}} labelClass="form-check-label" /> */}
          </label>
        </div>
      </div>
    </div>
  );
};
