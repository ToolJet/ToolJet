import React from 'react';

export const RadioColumn = ({ options, value, readOnly, onChange, containerWidth }) => {
  return (
    <div className="h-100 d-flex align-items-center">
      <div className="radio-column">
        {options.map((option) => (
          <label key={option.value} className="radio-wrapper">
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={() => !readOnly && onChange(option.value)}
              disabled={readOnly}
            />
            <span className="radio-label">{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
