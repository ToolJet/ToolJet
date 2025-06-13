import React from 'react';
import StartTrialButton from './components/StartTrialButton';
import ConsultationButton from './components/FreeConsultation';
import TrialEndsButton from './components/ExpiredTrialButton';

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
            <ConsultationButton text="Get a demo" onClick={onGetConsultation} />
          </>
        );
      case 'trial': {
        const daysText = trialDaysRemaining ? `${trialDaysRemaining} days left` : 'Trial active';
        return (
          <>
            <StartTrialButton text={daysText} onClick={onTrialAction} />
            <ConsultationButton text="Upgrade now" onClick={onGetConsultation} />
          </>
        );
      }
      case 'trial-ending':
        return (
          <>
            <TrialEndsButton text="Trial ends today" onClick={onTrialAction} />
            <ConsultationButton text="Upgrade now" onClick={onGetConsultation} />
          </>
        );
      case 'trial-expired':
        return (
          <>
            <TrialEndsButton text="Trial expired" onClick={onTrialAction} />
            <ConsultationButton text="Contact sales" onClick={onGetConsultation} />
          </>
        );
      case 'licensed':
        return <ConsultationButton text="Get support" onClick={onGetConsultation} />;
      default:
        return null;
    }
  };

  return <div className="tw-flex tw-flex-row tw-gap-3 tw-flex-shrink-0 tw-items-center">{renderButtons()}</div>;
}
