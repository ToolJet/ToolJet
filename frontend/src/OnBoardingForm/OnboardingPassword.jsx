import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';

function OnboardingPassword({ setFormData, formData, fieldType }) {
  const [showPassword, setShowPassword] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { t } = useTranslation();
  const { password } = formData;
  const handleOnCheck = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-password onboard-password">
      <input
        onChange={(e) => setFormData({ ...formData, [fieldType]: e.target.value })}
        type={showPassword ? 'text' : 'password'}
        className="onboard-input"
        name="password"
        placeholder="Enter new password"
        autoComplete="new-password"
        data-cy="password-input-field"
      />

      <div className="onboarding-password-hide-img" onClick={handleOnCheck} data-cy="password-visibility-toggle">
        {showPassword ? (
          <EyeHide
            fill={darkMode ? (password?.length ? '#D1D5DB' : '#656565') : password?.length ? '#384151' : '#D1D5DB'}
          />
        ) : (
          <EyeShow
            fill={darkMode ? (password?.length ? '#D1D5DB' : '#656565') : password?.length ? '#384151' : '#D1D5DB'}
          />
        )}
      </div>
      <span className="tj-input-helper-text" data-cy="password-helper-text">
        {t('loginSignupPage.passwordCharacter', 'Password must be at least 5 characters')}
      </span>
    </div>
  );
}

export default OnboardingPassword;
