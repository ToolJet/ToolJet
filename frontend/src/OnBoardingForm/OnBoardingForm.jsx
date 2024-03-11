import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { copyToClipboard } from '@/_helpers/appUtils';
import { toast } from 'react-hot-toast';
import OnBoardingInput from './OnBoardingInput';
import OnBoardingRadioInput from './OnBoardingRadioInput';
import ContinueButton from './ContinueButton';
import OnBoardingBubbles from './OnBoardingBubbles';
import AppLogo from '../_components/AppLogo';
import { getuserName, retrieveWhiteLabelText } from '@/_helpers/utils';
import { redirectToDashboard } from '@/_helpers/routes';
import { ON_BOARDING_SIZE, ON_BOARDING_ROLES } from '@/_helpers/constants';
import startsWith from 'lodash.startswith';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import posthog from 'posthog-js';
import initPosthog from '../_helpers/initPosthog';
import OnboardingTrialPage from './OnboardingTrialPage';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import SolidIcon from '../_ui/Icon/SolidIcons';

function OnBoardingForm({ userDetails = {}, token = '', organizationToken = '', password, darkMode, source = null }) {
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipLoading, setSkipLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [trialErrorMessage, setShowTrialErrorMessage] = useState('');
  const [whiteLabelText, setWhiteLabelText] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    companySize: '',
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
    retrieveWhiteLabelText().then((labelText) => {
      setWhiteLabelText(labelText);
    });
    if (completed) {
      authenticationService
        .onboarding({
          companyName: formData.companyName.trim(),
          companySize: formData.companySize,
          role: formData.role,
          token: token,
          source,
          organizationToken: organizationToken,
          ...(password?.length > 0 && { password }),
          phoneNumber: formData?.phoneNumber,
          requestedTrial: formData?.requestedTrial,
        })
        .then((data) => {
          /* Posthog Event */
          const ssoType = localStorage.getItem('ph-sso-type');
          const event = `signup_${
            source === 'sso' ? (ssoType === 'google' ? 'google' : ssoType === 'openid' ? 'openid' : 'github') : 'email'
          }`;
          initPosthog(data);
          posthog.capture(event, {
            email: data.email,
            workspace_id: data.organization_id || data.current_organization_id,
          });

          authenticationService.deleteLoginOrganizationId();
          setIsLoading(false);
          redirectToDashboard(data);
          setCompleted(false);
        })
        .catch((res) => {
          setShowTrialErrorMessage(res?.error || 'Something went wrong');
          setShowErrorModal(true);
          setSkipLoading(false);
          setIsLoading(false);
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
    `Where do you work ${userDetails?.name}?`,
    'What best describes your role?',
    'What is the size of your company?',
    'Enter your phone number',
    'Enter your phone number', //dummy for styling
  ];
  const FormSubTitles = [`This information will help us improve ${whiteLabelText}.`];

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
          <AppLogo darkMode={darkMode} isLoadingFromHeader={true} className="onboard-tooljet-logo" />
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
              data-cy="create-account-check-mark"
            ></img>
            Create account
          </p>
          <p
            className={page == 1 ? `active-onboarding-tab` : page < 1 ? 'passive-onboarding-tab' : ''}
            data-cy="verify-email-check-point"
          >
            {page >= 2 && (
              <img
                src={
                  darkMode
                    ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                    : 'assets/images/onboardingassets/Icons/Check.svg'
                }
                loading="lazy"
                alt="check mark"
                data-cy="verify-email-check-mark"
              ></img>
            )}
            Verify email
          </p>
          <p
            className={page >= 2 ? `active-onboarding-tab` : `passive-onboarding-tab`}
            data-cy="set-up-workspace-check-point"
          >
            {page >= 3 && (
              <img
                src={
                  darkMode
                    ? 'assets/images/onboardingassets/Icons/Check_dark.svg'
                    : 'assets/images/onboardingassets/Icons/Check.svg'
                }
                loading="lazy"
                alt="check mark"
                data-cy="verify-email-check-mark"
              ></img>
            )}
            Set up workspace
          </p>
          <div className="onboarding-divider" data-cy="onboarding-divider"></div>
        </div>
        <div></div> {/*Do not remove used for styling*/}
        <div className="onboarding-account-name" data-cy="user-account-name-avatar">
          {getuserName(userDetails)}
        </div>
      </div>
      <div className="page-wrap-onboarding">
        <div className={page < 4 ? 'onboarding-form' : 'container-xl'}>
          <div className={page == 0 ? 'onboarding-progress-cloud' : 'onboarding-progress-layout-cloud'}>
            {page !== 0 && page < 4 && (
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
              {page >= 0 && page < 4 && <OnBoardingBubbles formData={formData} page={page} />}
            </div>
            {page === 3 && (
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
            {/*Do not remove used for styling*/}
          </div>
          <div className="form-container">
            <div className="onboarding-header-wrapper">
              {page < 4 && (
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
              <Page0 {...pageProps} />
            ) : page == 1 ? (
              <Page1 {...pageProps} />
            ) : page == 2 ? (
              <Page2 {...pageProps} setIsLoading={setIsLoading} />
            ) : page == 3 ? (
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
      {ON_BOARDING_ROLES.map((field, index) => (
        <div key={field}>
          <OnBoardingRadioInput {...props} field={field} index={index} />
        </div>
      ))}
      <ContinueButton {...btnProps} />
    </div>
  );
}

export function Page2({ formData, setFormData, setPage, page, setCompleted, isLoading, darkMode }) {
  const props = { formData, setFormData, fieldType: 'companySize' };
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
      {ON_BOARDING_SIZE.map((field, index) => (
        <div key={field}>
          <OnBoardingRadioInput {...props} field={field} index={index} />
        </div>
      ))}
      <ContinueButton {...btnProps} />
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
        isValid={(inputNumber, country, countries) => {
          return countries.some((country) => {
            return startsWith(inputNumber, country.dialCode) || startsWith(country.dialCode, inputNumber);
          });
        }}
      />
      <ContinueButton {...btnProps} />
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
      <OnboardingTrialPage isSelfHosted={false} {...props} btnProps={btnProps} />
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

export default OnBoardingForm;
