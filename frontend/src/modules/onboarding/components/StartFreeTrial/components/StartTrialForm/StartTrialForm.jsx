import React, { useState } from 'react';
import { OnboardingForm } from '@/modules/onboarding/components';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store.js';
import { shallow } from 'zustand/shallow';
import { FormHeader, SubmitButton } from '@/modules/common/components';
import { useEnterKeyPress } from '@/modules/common/hooks';
import InfoFilled from './resources/images/info.svg';
import './resources/styles/start-trial.styles.scss';
import toast from 'react-hot-toast';

const StartTrialForm = () => {
  const { startTrial, trialDeclined } = useOnboardingStore(
    (state) => ({
      startTrial: state.startTrial,
      trialDeclined: state.trialDeclined,
    }),
    shallow
  );
  useEnterKeyPress(() => handleStartTrial());

  const [isLoading, setIsLoading] = useState(false);
  const [selectedButton, setSelectedButton] = useState(null);

  const handleStartTrial = async () => {
    try {
      setIsLoading(true);
      setSelectedButton('trial');
      await startTrial();
    } catch (error) {
      toast.error(error?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedButton(null);
    }
  };

  const handleDecline = async () => {
    try {
      setIsLoading(true);
      setSelectedButton('decline');
      await trialDeclined();
    } catch (error) {
      toast.error(error?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedButton(null);
    }
  };

  const TITLE = 'Before we dive in, would you like to start your free trial?';
  const DESCRIPTION = 'Build & scale your internal tools faster than ever with our advanced features.';

  return (
    <OnboardingForm title={TITLE} hideSubmitBtn={true}>
      <div className="free-trial-offer">
        <p className="description">{DESCRIPTION}</p>
        <div className="no-credit-card-banner">
          <InfoFilled />
          No credit card required!
        </div>

        <div className="action-buttons">
          <SubmitButton
            onClick={handleStartTrial}
            buttonText="Start your 14-day trial"
            isLoading={isLoading && selectedButton === 'trial'}
            disabled={isLoading || (selectedButton && selectedButton !== 'trial')}
          />
          <button
            className="decline-button"
            onClick={handleDecline}
            disabled={isLoading || (selectedButton && selectedButton !== 'decline')}
          >
            No, thanks
          </button>
        </div>
      </div>
    </OnboardingForm>
  );
};

export default StartTrialForm;
