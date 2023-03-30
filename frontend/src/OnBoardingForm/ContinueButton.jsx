import React, { useEffect } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';

function ContinueButton({ setPage, formData, page, setCompleted, isLoading, setIsLoading, darkMode }) {
  const activeCondition =
    isLoading ||
    (page == 0 && !formData.companyName) ||
    (page == 0 && formData.companyName.trim().length === 0) ||
    (page == 1 && !formData.role) ||
    (page == 2 && !formData.companySize);

  useEffect(() => {
    const keyDownHandler = (event) => {
      if (event.key === 'Enter' && !activeCondition) {
        if (page < 3) setPage((currPage) => currPage + 1);
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, formData, activeCondition]);

  return (
    <button
      className="onboarding-page-continue-button"
      disabled={activeCondition}
      onClick={(e) => {
        e.preventDefault();
        if (page < 3) setPage((currPage) => currPage + 1);
        if (page == 3) {
          setIsLoading(true);
          setCompleted(true);
        }
      }}
      data-cy="continue-button"
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
              (Object.values(formData)[page] == '' && page !== 3) || isLoading
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
