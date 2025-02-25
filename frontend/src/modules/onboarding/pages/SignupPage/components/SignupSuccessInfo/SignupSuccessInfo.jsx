import React, { useEffect } from 'react';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { OnboardingUIWrapper } from '@/modules/onboarding/components';
import { FormHeader } from '@/modules/common/components';
import './resources/styles/email-verification.styles.scss';
import ResendVerificationEmail from './components/ResendVerificationEmail/ResendVerificationEmail';
import SepratorComponent from '@/modules/common/components/SepratorComponent';

const SignupSuccessInfo = ({ email, name, backToSignup, organizationId, redirectTo }) => {
  const SignupSuccessInfoComponent = () => {
    const message = `We've sent a verification email to ${email}. Click the link inside to confirm your email and continue. This helps us ensure account security.`;
    const info = `Did not receive an email? Check your spam folder!`;
    return (
      <div className="email-verification-wrapper" style={{ width: '356px' }}>
        <OnboardingUIWrapper>
          <FormHeader>Check your mail</FormHeader>
          <p className="message">{message}</p>
          <span className="message">{info}</span>
          <SepratorComponent />
          <ResendVerificationEmail email={email} organizationId={organizationId} redirectTo={redirectTo} />
          <div className="back-to-signup-button" data-cy={'back-to-signup'}>
            <button onClick={() => backToSignup(email, name)} className="button-parent">
              <span className="button-text">Back to sign up</span>
            </button>
          </div>
        </OnboardingUIWrapper>
      </div>
    );
  };

  return (
    <OnboardingBackgroundWrapper
      MiddleComponent={() => <SignupSuccessInfoComponent email={email} name={name} backToSignup={backToSignup} />}
    />
  );
};

export default SignupSuccessInfo;
