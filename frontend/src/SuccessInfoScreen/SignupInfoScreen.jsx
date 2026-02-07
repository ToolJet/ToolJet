import React, { useState, useEffect } from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';

export const SignupInfoScreen = function SignupInfoScreen({
  email,
  backtoSignup,
  name,
  darkMode,
  organizationId,
  redirectTo,
}) {
  const [resendBtn, setResetBtn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [buttonText, setButtonText] = useState(
    t('signupInfoScreen.resendCountdown', 'Resend verification mail in {{seconds}} s', { seconds: 30 })
  );

  useEffect(() => {
    let timeLeft = 30;

    let timerId = resendBtn && setInterval(countdown, 1000);
    function countdown() {
      if (timeLeft == -1) {
        clearTimeout(timerId);
        setResetBtn(false);
        setButtonText(t('signupInfoScreen.resendAction', 'Resend verification mail'));
      } else {
        setButtonText(
          t('signupInfoScreen.resendCountdown', 'Resend verification mail in {{seconds}} s', { seconds: timeLeft })
        );
        timeLeft--;
      }
    }
  }, [resendBtn, t]);

  const resendInvite = (e) => {
    setIsLoading(true);

    e.preventDefault();
    authenticationService
      .resendInvite(email, organizationId, redirectTo)
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
          alt={t('successInfoScreen.emailImageAlt', 'Email image')}
          loading="lazy"
          data-cy="email-image"
        />
        <h1 className="common-auth-section-header" data-cy="onboarding-page-header">
          {t('successInfoScreen.checkYourMail', 'Check your mail')}
        </h1>
        <p className="info-screen-description" data-cy="onboarding-page-description">
          {t('signupInfoScreen.sentEmailPrefix', "We've sent an email to")}
          <span className="signup-email-name"> {email} </span>
          {t(
            'signupInfoScreen.sentEmailSuffix',
            'with a verification link. Please use that to verify your email address.'
          )}
        </p>
        <p className="info-screen-spam-msg" data-cy="email-page-spam-msg">
          {t('successInfoScreen.didNotReceiveEmail', 'Did not receive an email? Check your spam folder.')}
        </p>
        <div className="separator-onboarding">
          <div className="separator">
            <h2 data-cy="onboarding-separator">
              <span data-cy="onboarding-separator-text">{t('globals.or', 'OR')}</span>
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
              {buttonText}
            </ButtonSolid>
          )}
          <ButtonSolid
            variant="tertiary"
            type
            onClick={() => backtoSignup(email, name)}
            className="signup-info-edit-btn signup-info-btn"
            data-cy="edit-email-button"
          >
            {t('signupInfoScreen.editEmail', 'Edit email address')}
          </ButtonSolid>
        </>
      </div>
    </div>
  );
};
