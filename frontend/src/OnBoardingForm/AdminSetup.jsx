import React from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
import ContinueButton from './ContinueButton';
import OnBoardingInput from './OnBoardingInput';
import OnboardingPassword from './OnboardingPassword';

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

  return (
    <div className="onboarding-pages-wrapper">
      <p>Name</p>
      <OnBoardingInput {...props} fieldType="name" />
      <p>Work email</p>
      <OnBoardingInput {...props} fieldType="email" />
      <p>Password</p>
      <OnboardingPassword {...props} fieldType="password" />
      <button
        className="onboarding-page-continue-button"
        disabled={!formData?.email || !formData?.name || !formData?.password}
        onClick={() => {
          setPage(1);
        }}
      >
        {isLoading ? (
          <div className="spinner-center">
            <Spinner />
          </div>
        ) : (
          <>
            <p className="mb-0">Continue</p>
            <EnterIcon
              className="enter-icon-onboard"
              fill={
                (buttonState && Object.values(formData)[page] == '') ||
                (page == 0 && formData.companyName.trim().length === 0) ||
                isLoading
                  ? darkMode
                    ? '#656565'
                    : ' #D1D5DB'
                  : '#fff'
              }
            />
          </>
        )}
      </button>
      <p className="signup-terms">
        By signing up you are agreeing to the
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
