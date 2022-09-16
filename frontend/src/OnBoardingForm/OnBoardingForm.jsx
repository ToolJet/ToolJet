import React, { useState, useEffect } from 'react';

function OnBoardingForm() {
  const [buttonState, setButtonState] = useState(true);

  const [page, setPage] = useState(0);

  const [formData, setFormData] = useState({
    organization: '',
    role: '',
    companySize: '',
    employeeNo: '',
  });

  useEffect(() => {
    console.log('formdata', formData, buttonState, page);
  }, [formData, buttonState, page]);

  const FORM_TITLES = [
    'Where do you work John?',
    'What best describes your role',
    'What is the size of your company',
    'Where do you work John?',
  ];
  const FormSubTitles = [
    'ToolJet will not share your information with anyone. This information will help us tailor tooljet to you.',
  ];

  const PageShift = () => {
    if (page === 0) {
      return <Page0 formData={formData} setFormData={setFormData} setButtonState={setButtonState} />;
    } else if (page === 1) {
      return <Page1 formData={formData} setFormData={setFormData} setButtonState={setButtonState} />;
    } else if (page === 2) {
      return <Page2 formData={formData} setFormData={setFormData} setButtonState={setButtonState} />;
    } else {
      return <Page3 formData={formData} setFormData={setFormData} setButtonState={setButtonState} />;
    }
  };

  return (
    <div className="page">
      <div className="onboarding-navbar container-xl onboarding-navbar-layout">
        <div>
          <img src="assets/images/logo-color.svg" height="17.5" alt="tooljet-logo" data-cy="page-logo" />
        </div>
        <div></div>
        <div className="onboarding-checkpoints">
          <p>
            <img src={'assets/images/onboarding assets /01 Icons /Cheveron_Right.svg'}></img>Create account
          </p>
          <p>
            <img src={'assets/images/onboarding assets /01 Icons /Cheveron_Right.svg'}></img>Verify email
          </p>
          <p>Set up org</p>
          <div className="onboarding-divider"></div>
        </div>
        <div></div>
        <div className="onboarding-account-name">JA</div>
      </div>

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
              <img src="/assets/images/onboarding assets /01 Icons /Arrow_Back.svg" />
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
          {PageShift()}
          <div>{continueButton({ buttonState, setButtonState, setPage, page, formData })}</div>
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
        className={`onboarding-bubbles ${formData.organization !== '' && 'onboarding-bubbles-selected'} ${
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
      <div
        className={`onboarding-bubbles ${formData.employeeNo !== '' && 'onboarding-bubbles-selected'} ${
          page === 3 && 'onboarding-bubbles-active'
        }`}
      ></div>
    </div>
  );
}

export function continueButton({ buttonState, setPage, setButtonState, formData, page }) {
  return (
    <button
      className="onboarding-page-continue-button"
      disabled={buttonState && Object.values(formData)[page] == ''}
      onClick={() => {
        setPage((currPage) => currPage + 1);
        setButtonState(true);
        console.log('hecker', Object.values(formData)[page]);
      }}
    >
      <p className="mb-0">Continue</p>
      <img src="assets/images/onboarding assets /01 Icons /Enter.svg" className="onboarding-enter-icon"></img>
    </button>
  );
}

export function onBoardingInput({ formData, setFormData, setButtonState }) {
  return (
    <input
      value={formData.organization}
      placeholder="Enter your company name"
      className="onboard-input"
      onChange={(e) => {
        setFormData({ ...formData, organization: e.target.value });
        if (e.target.value !== '') setButtonState(false);
        else setButtonState(true);
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
          console.log('target', e.target.value);
          setFormData({ ...formData, [key]: e.target.value });
          setButtonState(false);
        }}
      />
      <p>{field}</p>
    </label>
  );
}

// __PAGES__

export function Page0({ formData, setFormData, setButtonState }) {
  return <div className="onboarding-pages-wrapper">{onBoardingInput({ formData, setFormData, setButtonState })}</div>;
}
export function Page1({ formData, setFormData, setButtonState }) {
  const ON_BOARDING_ROLES = [
    'Engineering manager',
    'Developer ',
    'Product manager',
    'Designer',
    'Mobile Developer',
    'Other',
  ];
  const key = 'role';
  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_ROLES.map((field) => (
        <div key={field}> {onBoardingRadioInput({ formData, setFormData, setButtonState, field, key })}</div>
      ))}
    </div>
  );
}
export function Page2({ formData, setFormData, setButtonState }) {
  const ON_BOARDING_SIZE = ['1-5', '5-20', '20-50', '50-100', '100-200', '200+'];
  const key = 'companySize';

  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_SIZE.map((field) => (
        <div key={field}> {onBoardingRadioInput({ formData, setFormData, setButtonState, field, key })}</div>
      ))}
    </div>
  );
}
export function Page3({ formData, setFormData, setButtonState }) {
  const ON_BOARDING_SIZE = ['1-5', '5-20', '20-50', '50-100', '100-200', '200+'];
  const key = 'employeeNo';

  return (
    <div className="onboarding-pages-wrapper">
      {ON_BOARDING_SIZE.map((field) => (
        <div key={field}> {onBoardingRadioInput({ formData, setFormData, setButtonState, field, key })}</div>
      ))}
    </div>
  );
}

export default OnBoardingForm;
