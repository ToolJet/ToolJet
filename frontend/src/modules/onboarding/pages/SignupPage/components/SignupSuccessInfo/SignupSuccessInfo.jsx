import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { OnboardingFormWrapper } from '@/modules/onboarding/components';
import { FormHeader } from '@/modules/common/components';
import cx from 'classnames';
import { authenticationService } from '@/_services';
import toast from 'react-hot-toast';
import './resources/styles/email-verification.styles.scss';

const SignupSuccessInfo = ({ email, name, backToSignup, organizationId, redirectTo }) => {
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    setIsResendDisabled(true);
    authenticationService
      .resendInvite(email, organizationId, redirectTo)
      .then(() => {
        setCountdown(30);
      })
      .catch(({ error }) => {
        setIsResendDisabled(false);
        toast.error(error, {
          position: 'top-center',
        });
      });
  };

  const SignupSuccessInfoComponent = () => {
    const message = `We've sent a verification email to ${email}. Click the link inside to confirm your email and continue. This helps us ensure account security.`;
    const info = `Did not receive an email? Check your spam folder!`;

    return (
      <div className="email-verification-wrapper" style={{ width: '356px' }}>
        <OnboardingFormWrapper>
          <FormHeader>Check your mail</FormHeader>
          <p className="message">{message}</p>
          <span className="message">{info}</span>
          <div className="separator-signup">
            <div className="mt-2 separator" data-cy="onboarding-separator">
              <h2>
                <span data-cy="onboarding-separator-text">OR</span>
              </h2>
            </div>
          </div>
          <div className="back-to-signup-button resend-border" data-cy={'resend-verification'}>
            <button
              onClick={handleResend}
              className={cx('button-parent', { disabled: isResendDisabled })}
              disabled={isResendDisabled}
            >
              <span className="button-text">
                {isResendDisabled ? `Resend verification email in ${countdown}s` : 'Resend verification email'}
              </span>
            </button>
          </div>
          <div className="back-to-signup-button" data-cy={'back-to-signup'}>
            <button onClick={() => backToSignup(email, name)} className="button-parent">
              <span className="button-text">Back to sign up</span>
            </button>
          </div>
        </OnboardingFormWrapper>
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
