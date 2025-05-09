import React from 'react';
import { FormHeader, FormDescription, SubmitButton } from '@/modules/common/components';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import useOnboardingStore from '@/modules/common/helpers/onboardingStoreHelper';
import useInvitationsStore from '@/modules/onboarding/stores/invitationsStore';
import { shallow } from 'zustand/shallow';
import './resources/styles/onboarding-form.styles.scss';
import LeftArow from './resources/images/left-arrow.svg';
import cx from 'classnames';

const OnboardingForm = ({
  title,
  description,
  children,
  onSubmit,
  isSubmitting,
  isFormValid,
  hideSubmitBtn = false,
}) => {
  const { currentStep, totalSteps, prevStep, disabledBackButton } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      prevStep: state.prevStep,
      disabledBackButton: state.disabledBackButton,
    }),
    shallow
  );
  const { initiatedInvitedUserOnboarding } = useInvitationsStore(
    (state) => ({
      initiatedInvitedUserOnboarding: state.initiatedInvitedUserOnboarding,
    }),
    shallow
  );

  const handleBackClick = () => {
    if (disabledBackButton) return;
    prevStep();
  };

  const disabledCondition = disabledBackButton || (initiatedInvitedUserOnboarding && currentStep === 1);
  const iconClasses = cx('steps__back', {
    disabled: disabledCondition,
  });

  return (
    <OnboardingUIWrapper>
      <OnboardingFormInsideWrapper>
        <div className="onboarding-questions-form">
          <div className="steps" data-cy="steps-details">
            <div className={iconClasses} onClick={handleBackClick} data-cy="back-button">
              <LeftArow />
            </div>
            <span>Step {currentStep == 0 ? currentStep + 1 : currentStep}</span> of {totalSteps}
          </div>
          <FormHeader>{title}</FormHeader>
          {description && <FormDescription>{description}</FormDescription>}
          <form onSubmit={onSubmit} className="">
            {children}
            {!hideSubmitBtn && (
              <SubmitButton
                buttonText={'Continue'}
                isLoading={isSubmitting}
                dataCy="onboarding-submit"
                onClick={onSubmit}
                disabled={!isFormValid}
              />
            )}
          </form>
        </div>
      </OnboardingFormInsideWrapper>
    </OnboardingUIWrapper>
  );
};

export default OnboardingForm;
