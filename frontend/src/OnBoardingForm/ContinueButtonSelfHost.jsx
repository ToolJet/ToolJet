import React, { useEffect, useState } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
import { validateEmail } from '../_helpers/utils';

function ContinueButtonSelfHost({
  setPage,
  setButtonState,
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
    if (page == 0)
      setActiveCondition(
        !name || !email || password.length < 5 || name.trim().length === 0 || email.trim().length === 0
      );
    else if (page == 1) setActiveCondition(!workspace || workspace.trim().length === 0);
    else if (page == 2) setActiveCondition(!companyName || companyName.trim().length === 0);
    else if (page == 3) setActiveCondition(!role);
    else setActiveCondition(!companySize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  return (
    <button
      className="onboarding-page-continue-button"
      disabled={activeCondition}
      onClick={() => {
        if (page == 4) {
          setIsLoading(true);
          setCompleted(true);
          return;
        }
        if (page == 0) {
          if (!validateEmail(email)) {
            setEmailError('Invalid Email');
            return;
          }
        }
        setPage((currPage) => currPage + 1);
        setButtonState(true);
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
            fill={activeCondition || isLoading ? (darkMode ? '#656565' : ' #D1D5DB') : '#fff'}
          />
        </>
      )}
    </button>
  );
}

export default ContinueButtonSelfHost;
