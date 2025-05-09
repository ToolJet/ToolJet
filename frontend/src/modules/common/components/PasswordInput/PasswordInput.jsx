import React, { useState } from 'react';
import './resources/styles/password-input.styles.scss';
import EyeClose from './resources/images/eyeclose.svg';
import EyeOpen from './resources/images/eyeopen.svg';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PasswordInput = ({
  label = 'Password',
  placeholder = 'Create a password',
  value,
  onChange,
  error,
  name = 'password',
  dataCy = 'password',
  minLength = 5,
  hint = `Password must be at least ${minLength} characters`,
  disabled = false,
  showForgotPassword = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const passwordClasses = cx('password-input', {
    'password-input--error': error,
    disabled: disabled,
  });

  return (
    <div className={passwordClasses}>
      <div className="password-input__label-wrapper">
        <label htmlFor={name} className="password-input__label" data-cy={`${dataCy}-label`}>
          {label} <span className="password-input__required">*</span>
        </label>
        {showForgotPassword && (
          <Link to="/forgot-password" tabIndex="-1" className="forgot-password" data-cy="forgot-password-link">
            {t('loginSignupPage.forgot', 'Forgot?')}
          </Link>
        )}
      </div>
      <div className="password-input__field-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          className="password-input__field"
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          required
          minLength={minLength}
          data-cy={`${dataCy}-input`}
<<<<<<< HEAD
          autoComplete="off"
=======
>>>>>>> main
        />
        <button
          type="button"
          className="password-input__toggle"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <div className="toggle-icon">{showPassword ? <EyeOpen /> : <EyeClose />}</div>
        </button>
      </div>
      {error ? (
        <p className="tj-input-error password-input__error" data-cy={`${dataCy}-error`}>
          {error}
        </p>
      ) : (
        <p className="password-input__hint" data-cy={`${dataCy}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
