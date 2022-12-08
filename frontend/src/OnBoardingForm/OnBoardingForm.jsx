import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import OnBoardingInput from './OnBoardingInput';
import OnBoardingRadioInput from './OnBoardingRadioInput';
import ContinueButton from './ContinueButton';
import OnBoardingBubbles from './OnBoardingBubbles';

function OnBoardingForm({ userDetails = {}, token = '', organizationToken = '', password, darkMode }) {
  const [buttonState, setButtonState] = useState(true);
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
    setButtonState,
    buttonState,
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

  const getuserName = () => {
    let nameArray = userDetails.name.split(' ');
    if (nameArray.length > 0)
      return `${nameArray?.[0][0]}${nameArray?.[1] != undefined && nameArray?.[1] != '' ? nameArray?.[1][0] : ''} `;
    return '';
  };

  const FORM_TITLES = [
    `Where do you work ${userDetails?.name}?`,
    'What best describes your role?',
    'What is the size of your company?',
    'What is the size of your company?', //dummy placeholder
  ];
  const FormSubTitles = ['ToolJet will not share your information with anyone. This information will help us.'];

  return (
    <div className="flex">
      <div className="onboarding-navbar onboarding-navbar-layout">
        <div className="tooljet-nav-logo">
          <img
            src="assets/images/logo-color.svg"
            className="onboard-tooljet-logo"
            alt="tooljet-logo"
            data-cy="page-logo"
            loading="lazy"
          />
        </div>
        <div></div>
        {/*Do not remove used for styling*/}
        <div className="onboarding-checkpoints">
          <p>
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
          <p>
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
          <p>Set up workspace</p>
          <div className="onboarding-divider"></div>
        </div>
        <div></div> {/*Do not remove used for styling*/}
        <div className="onboarding-account-name">{getuserName()}</div>
      </div>
      <div className="page-wrap-onboarding">
        <div className="onboarding-form">
          <div className={`${page !== 0 ? 'onboarding-progress' : 'onboarding-progress-layout'}`}>
            {page !== 0 && (
              <div
                className="onboarding-back-button"
                disabled={page == 0}
                onClick={() => {
                  setPage((currPage) => currPage - 1);
                  setButtonState(false);
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
                />
                <p>Back</p>
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
              <h1 className="onboarding-page-header">{FORM_TITLES[page]}</h1>
              <p className="onboarding-page-sub-header">{FormSubTitles[0]}</p>
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

export function Page0({
  formData,
  setFormData,
  setButtonState,
  buttonState,
  setPage,
  page,
  setCompleted,
  isLoading,
  darkMode,
}) {
  const props = { formData, setFormData, setButtonState, setPage };
  const btnProps = { buttonState, setButtonState, setPage, page, formData, setCompleted, isLoading, darkMode };
  return (
    <div className="onboarding-pages-wrapper">
      <OnBoardingInput {...props} />
      <ContinueButton {...btnProps} />
    </div>
  );
}

export function Page1({
  formData,
  setFormData,
  setButtonState,
  buttonState,
  setPage,
  page,
  setCompleted,
  isLoading,
  darkMode,
}) {
  const ON_BOARDING_ROLES = [
    'Engineering Manager',
    'Software Engineer',
    'Data Engineer',
    'Product Manager',
    'Data Scientist',
    'Business Analyst',
    'Others',
  ];
  const props = { formData, setFormData, setButtonState, fieldType: 'role' };
  const btnProps = { buttonState, setButtonState, setPage, page, formData, setCompleted, isLoading, darkMode };

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

export function Page2({
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
  const ON_BOARDING_SIZE = ['1-10', '11-50', '51-100', '101-500', '501-1000', '1000+'];
  const props = { formData, setFormData, setButtonState, fieldType: 'companySize' };
  const btnProps = {
    buttonState,
    setButtonState,
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
