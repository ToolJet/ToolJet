import React from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';

function ContinueButton({
  buttonState,
  setPage,
  setButtonState,
  formData,
  page,
  setCompleted,
  isLoading,
  setIsLoading,
  darkMode,
}) {
  return (
    <button
      className="onboarding-page-continue-button"
      disabled={
        (buttonState && Object.values(formData)[page] == '') ||
        isLoading ||
        (page == 0 && formData.companyName.trim().length === 0)
      }
      onClick={() => {
        setPage((currPage) => currPage + 1);
        setButtonState(true);
        if (page == 2) {
          setIsLoading(true);
          setCompleted(true);
        }
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
  );
}

export default ContinueButton;
