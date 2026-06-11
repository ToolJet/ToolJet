import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './AppInput.scss';

const InputField = ({
  value,
  label,
  placeholder = '',
  errorMessage,
  type = 'input',
  onChange,
  disabled,
  className = '',
  currentState = 'none',
}) => {
  const [data, setData] = useState(value);
  const mapHelpers = {
    success: 'tj-input-success',
    warning: 'tj-input-warning',
    error: 'tj-input-error',
    helper: 'tj-input-helper',
  };

  const handleChange = (event) => {
    const { value } = event.target;
    onChange(value);
    setData(data);
  };

  return (
    <div className="tj-app-input">
      {label && <label htmlFor="app-input-field">{label}</label>}

      {type === 'textarea' ? (
        <textarea
          className={className}
          placeholder={placeholder}
          value={data}
          defaultValue={value}
          onChange={handleChange}
        />
      ) : (
        <input
          type={type}
          value={data}
          disabled={disabled}
          className={`${className && className} ${currentState == 'error' && 'tj-input-error-state'}`}
          placeholder={placeholder}
          onChange={handleChange}
        />
      )}
      {errorMessage && <span className={`tj-sub-helper-text ${mapHelpers[currentState]}`}>{errorMessage}</span>}
    </div>
  );
};

InputField.propTypes = {
  value: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

InputField.defaultProps = {
  value: '',
  label: '',
  placeholder: '',
  type: 'text',
};

export default InputField;
