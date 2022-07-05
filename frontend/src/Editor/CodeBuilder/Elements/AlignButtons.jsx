import React from 'react';
import FxButton from './FxButton';

export const AlignButtons = ({ value, onChange, forceCodeBox, meta }) => {
  function handleOptionChanged(event) {
    onChange(event.currentTarget.value);
  }

  return (
    <div className="row fx-container">
      <div className="col">
        <div className={`mb-3 field ${meta?.options?.className}`}>
          <div style={{ display: 'flex', gap: 10 }}>
            <label className="radio-img">
              <input
                type="radio"
                name="alignment"
                value="left"
                onChange={handleOptionChanged}
                checked={value === 'left'}
              />
              <div className="action-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2 4H14M2 8H8.66667M2 12H12"
                    stroke={value == 'left' ? '#fff' : '#8092AC'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="tooltiptext">Left</span>
            </label>

            <label className="radio-img">
              <input
                type="radio"
                name="alignment"
                value="center"
                onChange={handleOptionChanged}
                checked={value === 'center'}
              />
              <div className="action-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2 4H14M4.66667 8H11.3333M3.33333 12H12.6667"
                    stroke={value == 'center' ? '#fff' : '#8092AC'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="tooltiptext">Center</span>
            </label>

            <label className="radio-img">
              <input
                type="radio"
                name="alignment"
                value="right"
                onChange={handleOptionChanged}
                checked={value === 'right'}
              />
              <div className="action-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2 4H14M7.33333 8H14M4 12H14"
                    stroke={value == 'right' ? '#fff' : '#8092AC'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="tooltiptext">Right</span>
            </label>

            <label className="radio-img">
              <input
                type="radio"
                name="alignment"
                value="justify"
                onChange={handleOptionChanged}
                checked={value === 'justify'}
              />
              <div className="action-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2 8H14M2 12H14M2 4H8H14H2Z"
                    stroke={value == 'justify' ? '#fff' : '#8092AC'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="tooltiptext">Justified</span>
            </label>
          </div>
        </div>
      </div>
      <div className="col-auto pt-0 style-fx fx-common">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
