import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import React from 'react';
import ContinueButtonSelfHost from './ContinueButtonSelfHost';

function OnboardingTrialPage(props) {
  const { btnProps } = props;
  const { setIsLoading, setCompleted } = btnProps;
  const { formData, setFormData, setSkipLoading, skipLoading } = props;

  const FEATURES_MAP = [
    {
      title: 'Unlimited Applications',
      free: true,
      paid: true,
    },
    {
      title: 'Custom React components',
      free: true,
      paid: true,
    },
    {
      title: 'Google & GitHub Sign-in',
      free: true,
      paid: true,
    },
    {
      title: 'Okta, AzureAD & OpenId Connect',
      free: false,
      paid: true,
    },
    {
      title: 'Custom branding white labelling',
      free: false,
      paid: true,
    },
    {
      title: 'Custom user groups & roles',
      free: false,
      paid: true,
    },
    {
      title: 'Unlimited ToolJet tables and rows',
      free: false,
      paid: true,
    },
    {
      title: 'Multiplayer Editing',
      free: false,
      paid: true,
    },
    {
      title: 'Multiple environments',
      free: false,
      paid: true,
    },
    {
      title: 'Git-sync (coming soon)',
      free: false,
      paid: true,
    },
    {
      title: 'Audit logs',
      free: false,
      paid: true,
    },
    {
      title: 'Air-gapped deployment',
      free: false,
      paid: true,
    },
    {
      title: 'Priority support via email, phone & private channel',
      free: false,
      paid: true,
    },
  ];

  const skipHandler = () => {
    setFormData({ ...formData, requestedTrial: false });
    setSkipLoading(false);
    setCompleted(true);
    return;
  };
  return (
    <div className="trial-page-wrapper">
      <div className="start-trial">
        <div className="tj-header-h1 mb-3">Start your 14-day Free Trial</div>
        <div className="tj-text-md mb-4">Build internal tools faster than ever with our advanced features.</div>
        <ContinueButtonSelfHost buttonName="Start your free trial" {...btnProps} setFormData={setFormData} />
        <ButtonSolid onClick={skipHandler} variant="tertiary">
          Skip
        </ButtonSolid>
      </div>
      <div className="features">
        <div className="card">
          <div className="header-wrapper">
            <div className="header">
              <div className="tj-text-md font-weight-500">Features</div>
              <div className="tj-text-md font-weight-500">Free</div>
              <div className="tj-text-md font-weight-500">Paid</div>
            </div>
          </div>
          <div className="body p-4">
            {FEATURES_MAP.map((feature, index) => (
              <div key={index} className="body-row">
                <div className="feature-title">{feature.title}</div>
                <div className="feature-radio free-radio">
                  <input type="radio" checked={feature.free} />
                </div>
                <div className="feature-radio paid-radio">
                  <input type="radio" checked={feature.paid} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTrialPage;
