import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import './styles/style.scss';

const StartTrialButton = ({ text = 'Start Trial', onClick = () => {} }) => {
  return (
    <Button variant="outline" leadingIcon="premium-plan" onClick={onClick}>
      {text}
    </Button>
  );
};

const ConsultationButton = ({ text = 'Start Trial', onClick = () => {} }) => {
  return (
    <Button variant="outline" leadingIcon="bookdemo" onClick={onClick} className="tw-consultation-btn">
      {text}
    </Button>
  );
};

const TrialEndsButton = ({ text = 'License expires today', onClick = () => {} }) => {
  return (
    <Button variant="outline" leadingIcon="premium-plan" onClick={onClick} className="tw-expired-trial-btn">
      {text}
    </Button>
  );
};

// licenseStatus: 'unlicensed' | 'trial' | 'trial-ending' | 'trial-expired' | 'licensed'
export default function LicenseNavBarActions({
  licenseStatus,
  trialDaysRemaining,
  onStartTrial,
  onGetConsultation,
  onTrialAction,
}) {
  const renderButtons = () => {
    switch (licenseStatus) {
      case 'unlicensed':
        return (
          <>
            <StartTrialButton text="Start 14-day trial" onClick={onStartTrial} />
            <ConsultationButton text="Get a free consultation" onClick={onGetConsultation} />
          </>
        );
      case 'trial': {
        const daysText = trialDaysRemaining ? `${trialDaysRemaining} days left` : 'Trial active';
        return (
          <>
            <StartTrialButton text={daysText} onClick={onTrialAction} />
          </>
        );
      }
      case 'trial-ending':
        return (
          <>
            <TrialEndsButton text="Trial ends today" onClick={onTrialAction} />
          </>
        );
      case 'trial-expired':
        return (
          <>
            <StartTrialButton text="Upgrade" onClick={onTrialAction} />
          </>
        );
      // case 'licensed':
      //   return <ConsultationButton text='Uport' onClick={onGetConsultation} />;
      default:
        return null;
    }
  };

  return <div className="tw-flex tw-flex-row tw-gap-3 tw-flex-shrink-0 tw-items-center">{renderButtons()}</div>;
}
