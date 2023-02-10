import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import OnBoardingInput from './OnBoardingInput';
import OnBoardingRadioInput from './OnBoardingRadioInput';
import ContinueButton from './ContinueButton';
import OnBoardingBubbles from './OnBoardingBubbles';
import { getuserName } from '@/_helpers/utils';
import { ON_BOARDING_SIZE, ON_BOARDING_ROLES } from '@/_helpers/constants';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';

function OnBoardingForm({ userDetails = {}, token = '', organizationToken = '', password, darkMode }) {
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;
  const history = useHistory();
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    companySize: '',
  });

  const pageProps = {
    formData,
    setFormData,
    setPage,
    page,
    setCompleted,
    isLoading,
    darkMode,
  };

  useEffect(() => {
    if (completed) {
      authenticationService
        .onboarding({
          companyName: formData.companyName.trim(),
          companySize: formData.companySize,
          role: formData.role,
          token: token,
          organizationToken: organizationToken,
          ...(password?.length > 0 && { password }),
        })
        .then((user) => {
          authenticationService.updateUser(user);
          authenticationService.deleteLoginOrganizationId();
          setIsLoading(false);
          history.push('/');
        })
        .catch((res) => {
          setIsLoading(false);
          toast.error(res.error || 'Something went wrong', {
            id: 'toast-login-auth-error',
            position: 'top-center',
          });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  const FORM_TITLES = [
    `Where do you work ${userDetails?.name}?`,
    'What best describes your role?',
    'What is the size of your company?',
    'What is the size of your company?', //dummy placeholder
  ];
  const FormSubTitles = ['This information will help us improve ToolJet.'];

  return (
    <div className="flex">
      <div className="onboarding-navbar onboarding-navbar-layout">
        <div className="tooljet-nav-logo">
          <Logo height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
        </div>
        <div></div>
        {/*Do not remove used for styling*/}
        <div className="onboarding-checkpoints">
          <p className={page == 0 ? `active-onboarding-tab` : ''} data-cy="create-account-check-point">
            <img
              src={
                darkMode
                  ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                  : 'assets/images/onboardingassets/Icons/Check.svg'
              }
              loading="lazy"
              alt="check mark"
            ></img>
            Create account
          </p>
          <p
            className={page == 1 ? `active-onboarding-tab` : page < 1 ? 'passive-onboarding-tab' : ''}
            data-cy="verify-email-check-point"
          >
            <img
              src={
                darkMode
                  ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                  : 'assets/images/onboardingassets/Icons/Check.svg'
              }
              loading="lazy"
              alt="check mark"
            ></img>
            Verify email
          </p>
          <p
            className={page >= 2 ? `active-onboarding-tab` : `passive-onboarding-tab`}
            data-cy="set-up-workspace-check-point"
          >
            Set up workspace
          </p>
          <div className="onboarding-divider"></div>
        </div>
        <div></div> {/*Do not remove used for styling*/}
        <div className="onboarding-account-name" data-cy="user-account-name-avatar">
          {getuserName(userDetails)}
        </div>
      </div>
      <div className="page-wrap-onboarding">
        <div className="onboarding-form">
          <div className={page == 0 ? 'onboarding-progress-cloud' : 'onboarding-progress-layout-cloud'}>
            {page !== 0 && (
              <div
                className="onboarding-back-button"
                disabled={page == 0}
                onClick={() => {
                  setPage((currPage) => currPage - 1);
                }}
              >
                <img
                  src={
                    darkMode
                      ? 'assets/images/onboardingassets/Icons/Arrow_Back_dark.svg'
                      : 'assets/images/onboardingassets/Icons/Arrow_Back.svg'
                  }
                  loading="lazy"
                  alt="arrow back"
                  data-cy="back-arrow"
                />
                <p className="onboarding-back-text" data-cy="back-arrow-text">
                  Back
                </p>
              </div>
            )}
            <div className="onboarding-bubbles-container">
              <OnBoardingBubbles formData={formData} page={page} />
            </div>
            <div></div>
            {/*Do not remove used for styling*/}
          </div>
          <div className="form-container">
            <div className="onboarding-header-wrapper">
              <h1 className="onboarding-page-header" data-cy="onboarding-page-header">
                {FORM_TITLES[page]}
              </h1>
              <p className="onboarding-page-sub-header" data-cy="onboarding-page-sub-header">
                {FormSubTitles[0]}
              </p>
            </div>
            {page == 0 ? (
              <Page0 {...pageProps} />
            ) : page == 1 ? (
              <Page1 {...pageProps} />
            ) : (
              <Page2 {...pageProps} setIsLoading={setIsLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// __PAGES__

export function Page0({ formData, setFormData, setPage, page, setCompleted, isLoading, darkMode }) {
  const props = { formData, setFormData, setPage };
  const btnProps = { setPage, page, formData, setCompleted, isLoading, darkMode };
  return (
    <div className="onboarding-pages-wrapper">
      <OnBoardingInput
        {...props}
        fieldType="companyName"
        placeholder="Enter company name"
        autoFocus={true}
        dataCy="company-name-input-field"
      />
      <ContinueButton {...btnProps} />
    </div>
  );
}

export function Page1({ formData, setFormData, setPage, page, setCompleted, isLoading, darkMode }) {
  const props = { formData, setFormData, fieldType: 'role' };
  const btnProps = { setPage, page, formData, setCompleted, isLoading, darkMode };

  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_ROLES.map((field) => (
        <div key={field}>
          <OnBoardingRadioInput {...props} field={field} />
        </div>
      ))}
      <ContinueButton {...btnProps} />
    </div>
  );
}

export function Page2({ formData, setFormData, setPage, page, setCompleted, isLoading, setIsLoading, darkMode }) {
  const props = { formData, setFormData, fieldType: 'companySize' };
  const btnProps = {
    setPage,
    page,
    formData,
    setCompleted,
    isLoading,
    setIsLoading,
    darkMode,
  };
  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_SIZE.map((field) => (
        <div key={field}>
          <OnBoardingRadioInput {...props} field={field} />
        </div>
      ))}
      <ContinueButton {...btnProps} />
    </div>
  );
}

export default OnBoardingForm;
