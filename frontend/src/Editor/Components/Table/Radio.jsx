import React from 'react';

export const Radio = ({ options, value, onChange, readOnly }) => {
  value = value === undefined ? [] : value;
  options = Array.isArray(options) ? options : [];

  return (
    <div className="radio row">
      <div>
        {options.map((option, index) => (
          <label
            key={index}
            className="form-check form-check-inline"
            onClick={() => {
              if (!readOnly) onChange(option.value);
            }}
          >
            <input
              className="form-check-input"
              type="radio"
              checked={option.value === value}
              disabled={readOnly && option.value !== value}
            />
            <span className="form-check-label">{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
