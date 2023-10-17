import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { copyToClipboard } from '@/_helpers/appUtils';
import { toast } from 'react-hot-toast';
import OnBoardingInput from './OnBoardingInput';
import OnBoardingRadioInput from './OnBoardingRadioInput';
import AdminSetup from './AdminSetup';
import OnboardingBubblesSH from './OnboardingBubblesSH';
import ContinueButtonSelfHost from './ContinueButtonSelfHost';
import { getuserName, getSubpath } from '@/_helpers/utils';
import { ON_BOARDING_SIZE, ON_BOARDING_ROLES } from '@/_helpers/constants';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';
import startsWith from 'lodash.startswith';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import OnboardingTrialPage from './OnboardingTrialPage';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import SolidIcon from '../_ui/Icon/SolidIcons';

function OnbboardingFromSH({ darkMode }) {
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipLoading, setSkipLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [trialErrorMessage, setShowTrialErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    companySize: '',
    name: '',
    email: '',
    password: '',
    workspace: '',
    phoneNumber: '',
    requestedTrial: false,
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
    if (page == 3) document.getElementsByClassName('tj-onboarding-phone-input').focus();
    if (completed) {
      authenticationService
        .setupAdmin({
          companyName: formData.companyName.trim(),
          companySize: formData.companySize,
          role: formData.role,
          password: formData.password,
          name: formData?.name,
          email: formData?.email,
          workspace: formData?.workspace,
          phoneNumber: formData?.phoneNumber,
          requestedTrial: formData?.requestedTrial,
        })
        .then((user) => {
          authenticationService.deleteLoginOrganizationId();
          setIsLoading(false);
          window.location = getSubpath()
            ? `${getSubpath()}/${user?.current_organization_id}`
            : `/${user?.current_organization_id}`;
          setCompleted(false);
        })
        .catch((res) => {
          setShowTrialErrorMessage(res?.error || 'Something went wrong');
          setIsLoading(false);
          setShowErrorModal(true);
          setSkipLoading(false);
          setCompleted(false);
          res?.statusCode !== 500 &&
            toast.error(res.error || 'Something went wrong', {
              id: 'toast-login-auth-error',
              position: 'top-center',
            });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  const FORM_TITLES = [
    `Set up your admin account`,
    `Set up your workspace`,
    `Where do you work ${formData?.name}?`,
    'What best describes your role?',
    'What is the size of your company?',
    'Enter your phone number',
    'Enter your phone number', //dummy placeholder
  ];
  const FormSubTitles = ['This information will help us improve ToolJet.'];

  const handleRetry = () => {
    setIsLoading(true);
    setShowErrorModal(false);
    setCompleted(true);
    setShowTrialErrorMessage('');
  };

  return (
    <div className="flex">
      <div className="onboarding-navbar onboarding-navbar-layout">
        <div className="tooljet-nav-logo">
          <Logo height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
        </div>
        <div></div>
        <div className="onboarding-checkpoints">
          <p className={page == 0 ? `active-onboarding-tab` : ''} data-cy="set-up-admin-check-point">
            <img
              src={
                darkMode
                  ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                  : 'assets/images/onboardingassets/Icons/Check.svg'
              }
              loading="lazy"
              alt="check mark"
            ></img>
            Set up admin
          </p>
          <p
            className={page == 1 ? `active-onboarding-tab` : page < 1 ? 'passive-onboarding-tab' : ''}
            data-cy="set-up-workspace-check-point"
          >
            {page >= 1 && (
              <img
                src={
                  darkMode
                    ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                    : 'assets/images/onboardingassets/Icons/Check.svg'
                }
                loading="lazy"
                alt="check mark"
              ></img>
            )}
            Set up workspace
          </p>
          <p
            className={page > 5 ? `active-onboarding-tab` : `passive-onboarding-tab`}
            data-cy="company-profile-check-point"
          >
            {page > 5 && (
              <img
                src={
                  darkMode
                    ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                    : 'assets/images/onboardingassets/Icons/Check.svg'
                }
                loading="lazy"
                alt="check mark"
              ></img>
            )}
            Company profile
          </p>
          <div className="onboarding-divider"></div>
        </div>
        <div></div>
        {page > 0 && (
          <div className="onboarding-account-name" data-cy="user-account-name-avatar">
            {getuserName(formData)}
          </div>
        )}
      </div>
      <div className="page-wrap-onboarding">
        <div className={page < 6 ? 'onboarding-form' : 'container-xl'}>
          <div className={page !== 0 ? 'onboarding-progress' : 'onboarding-progress-layout'}>
            <div className="navigation-wrap">
              {page > 1 && page < 6 && (
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
                {page > 1 && page < 6 && <OnboardingBubblesSH page={page} />}
              </div>
              {page > 1 && page < 6 && (
                <div
                  className="onboarding-back-button"
                  onClick={() => {
                    setPage((currPage) => currPage + 1);
                  }}
                >
                  <p className="onboarding-skip-text" data-cy="skip-arrow-text">
                    Skip
                  </p>
                  <img
                    src={
                      darkMode
                        ? 'assets/images/onboardingassets/Icons/Arrow_forward_dark.svg'
                        : 'assets/images/onboardingassets/Icons/Arrow_forward.svg'
                    }
                    loading="lazy"
                    alt="arrow front"
                    data-cy="skip-button"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="form-container">
            <div className="onboarding-header-wrapper">
              {page < 6 && (
                <>
                  <h1 className="onboarding-page-header" data-cy="onboarding-page-header">
                    {FORM_TITLES[page]}
                  </h1>
                  <p className="onboarding-page-sub-header" data-cy="onboarding-page-sub-header">
                    {FormSubTitles[0]}
                  </p>
                </>
              )}
            </div>
            {page == 0 ? (
              <AdminSetup {...pageProps} />
            ) : page == 1 ? (
              <WorkspaceSetupPage {...pageProps} />
            ) : page == 2 ? (
              <Page0 {...pageProps} setIsLoading={setIsLoading} />
            ) : page == 3 ? (
              <Page1 {...pageProps} setIsLoading={setIsLoading} />
            ) : page == 4 ? (
              <Page2 {...pageProps} setIsLoading={setIsLoading} />
            ) : page == 5 ? (
              <Page3 {...pageProps} setIsLoading={setIsLoading} />
            ) : (
              <TrialPage
                {...pageProps}
                setIsLoading={setIsLoading}
                setSkipLoading={setSkipLoading}
                skipLoading={isSkipLoading}
              />
            )}
          </div>
          <TrialErrorModal
            showErrorModal={showErrorModal}
            handleRetry={handleRetry}
            message={trialErrorMessage}
            handleClose={() => setShowErrorModal(false)}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}

// __PAGES__

export function Page0({ formData, setFormData, setPage, page, setCompleted, isLoading, darkMode }) {
  const props = { formData, setFormData, setPage, fieldType: 'companyName' };
  const btnProps = {
    setPage,
    page,
    formData,
    setCompleted,
    isLoading,
    darkMode,
  };
  return (
    <div className="onboarding-pages-wrapper">
      <OnBoardingInput {...props} placeholder="Enter company name" autoFocus={true} dataCy="company-name-input-field" />
      <ContinueButtonSelfHost {...btnProps} />
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
      <ContinueButtonSelfHost {...btnProps} />
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
      <ContinueButtonSelfHost {...btnProps} />
    </div>
  );
}
export function Page3({ formData, setFormData, setPage, page, setCompleted, isLoading, setIsLoading, darkMode }) {
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
      <PhoneInput
        inputProps={{
          autoFocus: true,
        }}
        country={'us'}
        value={formData?.phoneNumber}
        inputClass="tj-onboarding-phone-input"
        containerClass="tj-onboarding-phone-input-wrapper"
        onChange={(phone) => {
          setFormData({ ...formData, phoneNumber: phone });
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setPage((currPage) => currPage + 1);
          }
        }}
        isValid={(inputNumber, country, countries) => {
          return countries.some((country) => {
            return startsWith(inputNumber, country.dialCode) || startsWith(country.dialCode, inputNumber);
          });
        }}
      />
      <ContinueButtonSelfHost {...btnProps} />
    </div>
  );
}

export function TrialPage({
  formData,
  setFormData,
  setPage,
  page,
  setCompleted,
  isLoading,
  setSkipLoading,
  skipLoading,
  setIsLoading,
  darkMode,
}) {
  const props = { formData, setFormData, fieldType: 'trialRequested', setSkipLoading };
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
      <OnboardingTrialPage {...props} btnProps={btnProps} />
    </div>
  );
}

export function WorkspaceSetupPage({
  formData,
  setFormData,
  setPage,
  page,
  setCompleted,
  isLoading,
  setIsLoading,
  darkMode,
}) {
  const props = { formData, setFormData, setPage, fieldType: 'workspace' };

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
      <p className="onboarding-sh-labels" data-cy="workspace-name-input-label">
        Workspace name
      </p>
      <OnBoardingInput
        {...props}
        placeholder="Enter a workspace name"
        autoFocus={true}
        dataCy="workspace-name-input-field"
      />
      <ContinueButtonSelfHost {...btnProps} />
    </div>
  );
}

export function TrialErrorModal({ showErrorModal, handleClose, darkMode, message, handleRetry }) {
  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  return (
    <Modal
      show={showErrorModal}
      onHide={handleClose}
      size="sm"
      centered={true}
      contentClassName={`${darkMode ? 'theme-dark dark-theme license-error-modal' : 'license-error-modal'}`}
    >
      <Modal.Header data-cy="modal-header">
        <Modal.Title>Free Trial</Modal.Title>
        <div onClick={handleClose} className="cursor-pointer">
          <SolidIcon name="remove" width="20" />
        </div>
      </Modal.Header>
      <Modal.Body data-cy="modal-message">
        {message}
        <div className="form-group my-3">
          <div className="d-flex form-control p-0 border-0">
            Or Contact us at&nbsp;
            <span className="m-0" id="support-email">
              hello@tooljet.com
            </span>
            <SolidIcon
              className="mx-1 cursor-pointer"
              name="copy"
              width="16"
              onClick={() => copyFunction('support-email')}
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button className="cancel-btn" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant={'primary'} autoFocus onClick={handleRetry}>
          Try again
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default OnbboardingFromSH;
