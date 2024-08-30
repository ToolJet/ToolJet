import React from 'react';
import './resources/styles/form-textarea-input.styles.scss';
import cx from 'classnames';

const FormTextareaInput = ({
  label = 'Description',
  placeholder = 'Enter your description',
  value,
  onChange,
  error,
  name = 'description',
  dataCy = 'textarea-input',
  minLength = 10,
  maxLength = 500,
  hint = `Description must be between ${minLength} and ${maxLength} characters`,
  rows = 2,
  disabled = false,
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const textareaClasses = cx('textarea-input', {
    'textarea-input--error': error,
    disabled: disabled,
  });

  return (
    <div className={textareaClasses}>
      <label htmlFor={name} className="textarea-input__label" data-cy={`${dataCy}-label`}>
        {label} <span className="textarea-input__required">*</span>
      </label>
      <div className="textarea-input__field-wrapper">
        <textarea
          className="textarea-input__field"
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          required
          minLength={minLength}
          maxLength={maxLength}
          rows={rows}
          data-cy={dataCy}
        />
        <span className="tj-input-error textarea-input__error" data-cy={`${dataCy}-error`}>
          {error}
        </span>
      </div>
    </div>
  );
};

export default FormTextareaInput;
