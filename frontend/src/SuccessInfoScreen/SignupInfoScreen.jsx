import React, { useState, useEffect } from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';

export const SignupInfoScreen = function SignupInfoScreen({ email, backtoSignup, name, darkMode }) {
  const [resendBtn, setResetBtn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timeLeft = 30;
    let elem = document.getElementById('resend');

    let timerId = resendBtn && setInterval(countdown, 1000);
    function countdown() {
      if (timeLeft == -1) {
        clearTimeout(timerId);
        setResetBtn(false);
        elem.innerHTML = 'Resend verification mail ';
      } else {
        elem.innerHTML = 'Resend verification mail in ' + timeLeft + ' s';
        timeLeft--;
      }
    }
  }, [resendBtn]);

  const resendInvite = (e) => {
    setIsLoading(true);

    e.preventDefault();
    authenticationService
      .resendInvite(email)
      .then(() => {
        setIsLoading(false);
        setResetBtn(true);
      })
      .catch(({ error }) => {
        setIsLoading(false);
        toast.error(error, {
          position: 'top-center',
        });
      });
  };

  return (
    <div className="info-screen-wrapper">
      <div className="signup-info-card">
        <img
          className="info-screen-email-img"
          src={
            darkMode
              ? 'assets/images/onboardingassets/Illustrations/verify_email_dark.svg'
              : 'assets/images/onboardingassets/Illustrations/verify_email.svg'
          }
          alt="email image"
          loading="lazy"
          data-cy="email-image"
        />
        <h1 className="common-auth-section-header" data-cy="onboarding-page-header">
          Check your mail
        </h1>
        <p className="info-screen-description" data-cy="onboarding-page-description">
          We’ve sent an email to <span className="signup-email-name">{email} </span>with a verification link. Please use
          that to verify your email address.
        </p>
        <p className="info-screen-spam-msg" data-cy="email-page-spam-msg">
          Did not receive an email? Check your spam folder.
        </p>
        <div className="separator-onboarding">
          <div className="separator">
            <h2 data-cy="onboarding-separator">
              <span data-cy="onboarding-separator-text">OR</span>
            </h2>
          </div>
        </div>

        <>
          {isLoading ? (
            <ButtonSolid variant="secondary" className="signup-info-resend-btn signup-info-btn" disabled={isLoading}>
              <div className="spinner-center">
                <Spinner />
              </div>
            </ButtonSolid>
          ) : (
            <ButtonSolid
              variant="secondary"
              onClick={(e) => {
                resendInvite(e);
              }}
              id="resend"
              className="signup-info-resend-btn signup-info-btn"
              disabled={resendBtn || isLoading}
              data-cy="resend-email-button"
            >
              Resend verification mail in 30s
            </ButtonSolid>
          )}
          <ButtonSolid
            variant="tertiary"
            type
            onClick={() => backtoSignup(email, name)}
            className="signup-info-edit-btn signup-info-btn"
            data-cy="edit-email-button"
          >
            Edit email address
          </ButtonSolid>
        </>
      </div>
    </div>
  );
};
