import React, { useState, useEffect } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import Spinner from '@/_ui/Spinner';

function OnBoardingForm({ userDetails = {}, token = '' }) {
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

  useEffect(() => {
    if (completed) {
      setIsLoading(true);
      authenticationService
        .onboarding({
          companyName: formData.companyName.trim(),
          companySize: formData.companySize,
          role: formData.role,
          token: token,
        })
        .then((user) => {
          authenticationService.updateUser(user);
          authenticationService.deleteLoginOrganizationId();
          setIsLoading(false);
          history.push('/');
        })
        .catch((res) => {
          toast.error(res.error || 'Something went wrong', {
            id: 'toast-login-auth-error',
            position: 'top-center',
          });
        });
    }
  }, [completed]);

  const getuserName = () => {
    let namearr = userDetails.name.split(' ');
    if (namearr.length > 0) return `${namearr?.[0][0]}${namearr?.[1] != undefined ? namearr?.[1][0] : ''} `;
    return '';
  };

  const FORM_TITLES = [
    `Where do you work ${userDetails?.name}?`,
    'What best describes your role',
    'What is the size of your company',
  ];
  const FormSubTitles = [
    'ToolJet will not share your information with anyone. This information will help us tailor tooljet to you.',
  ];

  const PageShift = ({ buttonState, setPage, page, setCompleted, isLoading }) => {
    if (page === 0) {
      return (
        <Page0
          formData={formData}
          setFormData={setFormData}
          setButtonState={setButtonState}
          buttonState={buttonState}
          setPage={setPage}
          page={page}
          setCompleted={setCompleted}
          isLoading={isLoading}
        />
      );
    } else if (page === 1) {
      return (
        <Page1
          formData={formData}
          setFormData={setFormData}
          setButtonState={setButtonState}
          buttonState={buttonState}
          setPage={setPage}
          page={page}
          setCompleted={setCompleted}
          isLoading={isLoading}
        />
      );
    } else {
      return (
        <Page2
          formData={formData}
          setFormData={setFormData}
          setButtonState={setButtonState}
          buttonState={buttonState}
          setPage={setPage}
          page={page}
          setCompleted={setCompleted}
          isLoading={isLoading}
        />
      );
    }
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
          />
        </div>
        <div></div>
        <div className="onboarding-checkpoints">
          <p>
            <img src={'assets/images/onboardingassets/Icons/Check.svg'}></img>Create account
          </p>
          <p>
            <img src={'assets/images/onboardingassets/Icons/Check.svg'}></img>Verify email
          </p>
          <p>Set up org</p>
          <div className="onboarding-divider"></div>
        </div>
        <div></div>
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
                style={{ cursor: 'pointer' }}
              >
                <img src="/assets/images/onboardingassets/Icons/Arrow_Back.svg" />
                <p>Back</p>
              </div>
            )}
            <div className="onboarding-bubbles-container">{onBoardingBubbles({ formData, page })}</div>
            <div></div>
          </div>
          <div className="form-container">
            <div className="onboarding-header-wrapper">
              <h1 className="onboarding-page-header">{FORM_TITLES[page]}</h1>
              <p className="onboarding-page-sub-header">{FormSubTitles[0]}</p>
            </div>
            {PageShift({ buttonState, setPage, page, formData, setCompleted, isLoading })}
          </div>
        </div>
      </div>
    </div>
  );
}

// __COMPONENTS__

export function onBoardingBubbles({ formData, page }) {
  return (
    <div className="onboarding-bubbles-wrapper">
      <div
        className={`onboarding-bubbles ${formData.companyName !== '' && 'onboarding-bubbles-selected'} ${
          page === 0 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.role !== '' && 'onboarding-bubbles-selected'} ${
          page === 1 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.companySize !== '' && 'onboarding-bubbles-selected'} ${
          page === 2 && 'onboarding-bubbles-active'
        } `}
      ></div>
    </div>
  );
}

export function continueButton({ buttonState, setPage, setButtonState, formData, page, setCompleted, isLoading }) {
  return (
    <button
      className="onboarding-page-continue-button"
      disabled={(buttonState && Object.values(formData)[page] == '') || isLoading}
      onClick={() => {
        setPage((currPage) => currPage + 1);
        setButtonState(true);
        if (page == 2) {
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
            fill={buttonState && Object.values(formData)[page] == '' ? ' #D1D5DB' : '#fff'}
          />
        </>
      )}
    </button>
  );
}

export function onBoardingInput({ formData, setFormData, setButtonState, setPage }) {
  return (
    <input
      defaultValue={formData.companyName}
      placeholder="Enter your company name"
      className="onboard-input"
      onKeyUp={(e) => {
        setFormData({ ...formData, companyName: e.target.value });
        if (e.target.value !== '') setButtonState(false);
        else setButtonState(true);
        if (e.key === 'Enter') {
          setPage((currPage) => currPage + 1);
        }
      }}
    />
  );
}

export function onBoardingRadioInput(props) {
  const { formData, setFormData, setButtonState, field, key } = props;
  return (
    <label className={`onboard-input ${formData[key] === field && 'onboarding-radio-checked'}`}>
      <input
        type="radio"
        name={field}
        value={field}
        checked={formData[key] === field}
        onChange={(e) => {
          setFormData({ ...formData, [key]: e.target.value });
          setButtonState(false);
        }}
      />
      <p>{field}</p>
    </label>
  );
}

// __PAGES__

export function Page0({ formData, setFormData, setButtonState, buttonState, setPage, page, setCompleted, isLoading }) {
  return (
    <div className="onboarding-pages-wrapper">
      {onBoardingInput({ formData, setFormData, setButtonState, setPage })}
      {continueButton({ buttonState, setButtonState, setPage, page, formData, setCompleted, isLoading })}
    </div>
  );
}
export function Page1({ formData, setFormData, setButtonState, buttonState, setPage, page, setCompleted, isLoading }) {
  const ON_BOARDING_ROLES = [
    'Engineering Manager',
    'Software Engineer',
    'Data Engineer',
    'Product Manager',
    'Data Scientist',
    'Business Analyst',
    'Others',
  ];
  const key = 'role';
  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_ROLES.map((field) => (
        <div key={field}> {onBoardingRadioInput({ formData, setFormData, setButtonState, field, key })}</div>
      ))}
      {continueButton({ buttonState, setButtonState, setPage, page, formData, setCompleted, isLoading })}
    </div>
  );
}
export function Page2({ formData, setFormData, setButtonState, buttonState, setPage, page, setCompleted, isLoading }) {
  const ON_BOARDING_SIZE = ['1-10', '11-50', '51-100', '101-500', '501-1000', '1000+'];
  const key = 'companySize';

  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_SIZE.map((field) => (
        <div key={field}> {onBoardingRadioInput({ formData, setFormData, setButtonState, field, key })}</div>
      ))}
      {continueButton({ buttonState, setButtonState, setPage, page, formData, setCompleted, isLoading })}
    </div>
  );
}

export default OnBoardingForm;
