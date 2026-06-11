import React from 'react';
import { useTranslation } from 'react-i18next';
import FormTextInput from '../FormTextInput';
const EmailComponent = ({
  prefilledEmail,
  email,
  handleChange,
  emailError,
  label,
  disabled,
  disableStartAdornment,
}) => {
  const { t } = useTranslation();

  return (
    <div className="email-input">
      <FormTextInput
        label={label || 'Email'}
        placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your work email')}
        value={prefilledEmail || email}
        onChange={handleChange}
        type="email"
        error={emailError}
        disabled={!!prefilledEmail || disabled}
        name="email"
        dataCy="email-input"
        disableStartAdornment={disableStartAdornment}
      />
    </div>
  );
};
export default EmailComponent;
// To DO : Move all the Email input fields in the onboarding flow/ Auth related pages to use Email component instead of FormTextInput
