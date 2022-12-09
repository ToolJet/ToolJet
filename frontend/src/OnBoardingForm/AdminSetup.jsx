import React, { useState } from 'react';
import OnBoardingInput from './OnBoardingInput';
import OnboardingPassword from './OnboardingPassword';
import ContinueButtonSelfHost from './ContinueButtonSelfHost';

function AdminSetup({
  formData,
  setFormData,
  setButtonState,
  buttonState,
  setPage,
  page,
  setCompleted,
  isLoading,
  setIsLoading,
  darkMode,
}) {
  const props = { formData, setFormData, setButtonState, setPage };
  const btnProps = {
    buttonState,
    setButtonState,
    setPage,
    page,
    formData,
    setCompleted,
    isLoading,
    setIsLoading,
    darkMode,
  };
  const [emailError, setEmailError] = useState(false);
  return (
    <div className="onboarding-pages-wrapper">
      <p>Name</p>
      <OnBoardingInput {...props} fieldType="name" />
      <p>Work email</p>
      <OnBoardingInput {...props} fieldType="email" emailError={emailError} setEmailError={setEmailError} />
      <p>Password</p>
      <OnboardingPassword {...props} fieldType="password" />
      <ContinueButtonSelfHost {...btnProps} setEmailError={setEmailError} />
      <p className="signup-terms">
        By continuing up you are agreeing to the
        <br />
        <span>
          <a href="https://www.tooljet.com/terms">Terms of Service </a>&
          <a href="https://www.tooljet.com/privacy"> Privacy Policy</a>
        </span>
      </p>
    </div>
  );
}

export default AdminSetup;
