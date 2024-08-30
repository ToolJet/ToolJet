import React from 'react';
import './resources/styles/form-text-input.styles.scss';

const FormTextInput = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled,
  name,
  dataCy,
  maxLength,
  disableStartAdornment = false,
}) => {
  return (
    <div className={`form-input ${disabled ? 'form-input--disabled' : ''}`}>
      <label htmlFor={name} className="form-input__label" data-cy={`${dataCy}-label`}>
        {label} {!disableStartAdornment && <span className="form-input__required">*</span>}
      </label>

      {disabled ? (
        <p className="form-input__field form-input__field--disabled" data-cy={dataCy}>
          {value}
        </p>
      ) : (
        <>
          <input
            type={type}
            className="form-input__field"
            id={name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
            data-cy={dataCy}
            autoComplete="off"
            {...(maxLength ? { maxLength } : {})}
          />
          <span className="tj-input-error form-input__error">{error}</span>
        </>
      )}
    </div>
  );
};

export default FormTextInput;
