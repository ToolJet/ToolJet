import React, { useEffect, useState } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
import { validateEmail } from '@/_helpers/utils';

function ContinueButtonSelfHost({
  setPage,
  formData,
  page,
  setCompleted,
  isLoading,
  setIsLoading,
  darkMode,
  setEmailError = false,
}) {
  const [activeCondition, setActiveCondition] = useState();
  const { companyName, role, companySize, name, email, password, workspace } = formData;

  useEffect(() => {
    switch (page) {
      case 0:
        setActiveCondition(
          !name || !email || password.length < 5 || name.trim().length === 0 || email.trim().length === 0
        );
        break;
      case 1:
        setActiveCondition(!workspace || workspace.trim().length === 0);
        break;
      case 2:
        setActiveCondition(!companyName || companyName.trim().length === 0);
        break;
      case 3:
        setActiveCondition(!role);
        break;
      case 4:
        setActiveCondition(!companySize);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  useEffect(() => {
    const keyDownHandler = (event) => {
      if (event.key === 'Enter' && !activeCondition) {
        if (page == 0) {
          if (!validateEmail(email)) {
            setEmailError('Invalid Email');
            return;
          }
        }
        if (page < 5) setPage((currPage) => currPage + 1);
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
        if (page == 0) {
          if (!validateEmail(email)) {
            setEmailError('Invalid Email');
            return;
          }
        }
        if (page < 5) setPage((currPage) => currPage + 1);
        if (page == 5) {
          setIsLoading(true);
          setCompleted(true);
          return;
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
            fill={activeCondition || isLoading ? (darkMode ? '#656565' : ' #D1D5DB') : '#fff'}
          />
        </>
      )}
    </button>
  );
}

export default ContinueButtonSelfHost;
