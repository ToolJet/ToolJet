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
      <p className="onboarding-sh-labels" data-cy="name-input-label">
        Name
      </p>
      <OnBoardingInput
        {...props}
        fieldType="name"
        placeholder="Enter your full name"
        autoFocus={true}
        dataCy="name-input-field"
      />
      <p className="onboarding-sh-labels" data-cy="email-input-label">
        Email
      </p>
      <OnBoardingInput
        placeholder="Enter your email"
        className="onboard-email-input"
        {...props}
        fieldType="email"
        emailError={emailError}
        setEmailError={setEmailError}
        dataCy="email-input-field"
      />
      <p className="onboard-password-label onboarding-sh-labels" data-cy="password-label">
        Password
      </p>
      <OnboardingPassword {...passwordProps} fieldType="password" data-cy="password-input-field" />
      <ContinueButtonSelfHost {...btnProps} setEmailError={setEmailError} />
      <p className="signup-terms" data-cy="signup-terms-helper">
        By continuing you are agreeing to the
        <br />
        <span>
          <a href="https://www.tooljet.com/terms" data-cy="terms-of-service-link">
            Terms of Service
          </a>
          &
          <a href="https://www.tooljet.com/privacy" data-cy="privacy-policy-link">
            Privacy Policy
          </a>
        </span>
      </p>
    </div>
  );
}

export default AdminSetup;
