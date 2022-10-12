import React, { useState, useEffect } from 'react';
import { ButtonSolid } from '../_components/AppButton';

export const SignupInfoScreen = function SignupInfoScreen({ email, signup, backtoSignup }) {
  const [resendBtn, setResetBtn] = useState(true);

  useEffect(() => {
    let timeLeft = 10;
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

  return (
    <div className="info-screen-wrapper">
      <div className="signup-info-card">
        <img
          className="info-screen-email-img"
          src={'assets/images/onboarding assets /02 Illustrations /verify email.svg'}
          alt="email image"
        />
        <h1 className="common-auth-section-header">Check your mail</h1>
        <p className="info-screen-description">
          We’ve sent an email to <span className="signup-email-name">{email} </span>with a verification link. Please use
          that to verify your email address
        </p>
        <p className="info-screen-spam-msg">Did not receive an email? Check your spam folder</p>
        <div className="separator-onboarding">
          <div className="separator">
            <h2>
              <span>OR</span>
            </h2>
          </div>
        </div>

        <>
          <ButtonSolid
            variant="secondary"
            onClick={(e) => {
              setResetBtn(true);
              signup(e);
            }}
            id="resend"
            className="singup-info-resend-btn singup-info-btn"
            disabled={resendBtn}
          >
            Resend verification mail in 30s
          </ButtonSolid>
          <ButtonSolid
            variant="tirtiary"
            type
            onClick={() => backtoSignup()}
            className="singup-info-edit-btn singup-info-btn"
          >
            Edit email address
          </ButtonSolid>
        </>
      </div>
    </div>
  );
};
