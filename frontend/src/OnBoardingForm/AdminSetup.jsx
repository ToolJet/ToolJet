import React, { useState } from 'react';
import OnBoardingInput from './OnBoardingInput';
import OnboardingPassword from './OnboardingPassword';
import ContinueButtonSelfHost from './ContinueButtonSelfHost';

function AdminSetup({ formData, setFormData, setPage, page, setCompleted, isLoading, setIsLoading, darkMode }) {
  const props = { formData, setFormData, setPage };
  const btnProps = {
    setPage,
    page,
    formData,
    setCompleted,
    isLoading,
    setIsLoading,
    darkMode,
  };
  const passwordProps = { formData, setFormData };
  const [emailError, setEmailError] = useState(false);
  return (
    <div className="onboarding-pages-wrapper">
      <p className="onboarding-sh-labels">Name</p>
      <OnBoardingInput {...props} fieldType="name" placeholder="Enter your full name" autoFocus={true} />
      <p className="onboarding-sh-labels">Work email</p>
      <OnBoardingInput
        placeholder="Enter your work email"
        className="onboard-email-input"
        {...props}
        fieldType="email"
        emailError={emailError}
        setEmailError={setEmailError}
      />
      <p className="onboard-password-label onboarding-sh-labels">Password</p>
      <OnboardingPassword {...passwordProps} fieldType="password" />
      <ContinueButtonSelfHost {...btnProps} setEmailError={setEmailError} />
      <p className="signup-terms">
        By continuing you are agreeing to the
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
