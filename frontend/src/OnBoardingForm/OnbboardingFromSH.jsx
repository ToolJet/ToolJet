import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import OnBoardingInput from './OnBoardingInput';
import OnBoardingRadioInput from './OnBoardingRadioInput';
import AdminSetup from './AdminSetup';
import OnboardingBubblesSH from './OnboardingBubblesSH';
import ContinueButtonSelfHost from './ContinueButtonSelfHost';

function OnbboardingFromSH({ darkMode }) {
  const history = useHistory();
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    companySize: '',
    name: '',
    email: '',
    password: '',
    workspace: '',
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
        .setupAdmin({
          companyName: formData.companyName.trim(),
          companySize: formData.companySize,
          role: formData.role,
          password: formData.password,
          name: formData?.name,
          email: formData?.email,
          workspace: formData?.workspace,
        })
        .then((user) => {
          authenticationService.updateUser(user);
          authenticationService.deleteLoginOrganizationId();
          setIsLoading(false);
          history.push('/');
        })
        .catch((res) => {
          setIsLoading(false);
          setCompleted(false);
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
    'What is the size of your company?', //dummy placeholder
  ];
  const FormSubTitles = ['This information will help us improve ToolJet.'];

  const getuserName = () => {
    let nameArray = formData?.name?.split(' ');
    if (nameArray?.length > 0)
      return `${nameArray?.[0][0]}${nameArray?.[1] != undefined && nameArray?.[1] != '' ? nameArray?.[1][0] : ''} `;
    return '';
  };

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
            onClick={() => history.push('/')}
          />
        </div>
        <div></div>
        <div className="onboarding-checkpoints">
          <p className={page == 0 ? `active-onboarding-tab` : ''}>
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
          <p className={page == 1 ? `active-onboarding-tab` : page < 1 ? 'passive-onboarding-tab' : ''}>
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
          <p className={page >= 2 ? `active-onboarding-tab` : `passive-onboarding-tab`}>Company profile</p>
          <div className="onboarding-divider"></div>
        </div>
        <div></div>
        {page > 0 && <div className="onboarding-account-name">{getuserName()}</div>}{' '}
      </div>
      <div className="page-wrap-onboarding">
        <div className="onboarding-form">
          <div className={page !== 0 ? 'onboarding-progress' : 'onboarding-progress-layout'}>
            <div className="navigation-wrap">
              {page > 1 && (
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
                  />
                  <p className="onboarding-back-text">Back</p>
                </div>
              )}
              <div className="onboarding-bubbles-container">{page > 1 && <OnboardingBubblesSH page={page} />}</div>
              {page > 1 && (
                <div
                  className="onboarding-back-button"
                  onClick={() => {
                    page != 4 && setPage((currPage) => currPage + 1);
                    if (page == 4) {
                      setIsLoading(true);
                      setCompleted(true);
                      return;
                    }
                  }}
                >
                  <p className="onboarding-skip-text">Skip</p>
                  <img
                    src={
                      darkMode
                        ? 'assets/images/onboardingassets/Icons/Arrow_forward_dark.svg'
                        : 'assets/images/onboardingassets/Icons/Arrow_forward.svg'
                    }
                    loading="lazy"
                    alt="arrow front"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="form-container">
            <div className="onboarding-header-wrapper">
              <h1 className="onboarding-page-header">{FORM_TITLES[page]}</h1>
              <p className="onboarding-page-sub-header">{FormSubTitles[0]}</p>
            </div>
            {page == 0 ? (
              <AdminSetup {...pageProps} />
            ) : page == 1 ? (
              <WorkspaceSetupPage {...pageProps} />
            ) : page == 2 ? (
              <Page0 {...pageProps} setIsLoading={setIsLoading} />
            ) : page == 3 ? (
              <Page1 {...pageProps} setIsLoading={setIsLoading} />
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
      <OnBoardingInput {...props} placeholder="Enter company name" autoFocus={true} />
      <ContinueButtonSelfHost {...btnProps} />
    </div>
  );
}

export function Page1({ formData, setFormData, setPage, page, setCompleted, isLoading, darkMode }) {
  const ON_BOARDING_ROLES = [
    'Engineering Manager',
    'Software Engineer',
    'Data Engineer',
    'Product Manager',
    'Data Scientist',
    'Business Analyst',
    'Others',
  ];
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
  const ON_BOARDING_SIZE = ['1-10', '11-50', '51-100', '101-500', '501-1000', '1000+'];
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
      <p>Workspace name</p>
      <OnBoardingInput {...props} placeholder="Enter a workspace name" autoFocus={true} />
      <ContinueButtonSelfHost {...btnProps} />
    </div>
  );
}

export default OnbboardingFromSH;
