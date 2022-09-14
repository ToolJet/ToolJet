import React, { useState, useEffect } from 'react';

function SuccessinfoScreen({ props, email }) {
  const [show, setShow] = useState(false);
  const [resendBtn, setResetBtn] = useState(true);

  useEffect(() => {
    let timeLeft = 30;
    let elem = document.getElementById('resend');

    let timerId = setInterval(countdown, 1000);
    function countdown() {
      if (timeLeft == -1) {
        clearTimeout(timerId);
        setResetBtn(false);
      } else {
        elem.innerHTML = 'Resend verification mail in ' + timeLeft + ' s';
        timeLeft--;
      }
    }
  }, [resendBtn]);

  return (
    <div>
      <div className="email-verification-wrapper">
        <div className="email-verification-card">
          <img
            className="onboarding-page-email-img"
            src={'assets/images/onboarding assets /02 Illustrations /verify email.svg'}
            alt="email image"
          />
          <h1 className="common-auth-section-header">Check your mail.</h1>
          <p className="onboarding-page-verify--subheading">
            We’ve sent an email to <span className="singup-email-name">{email} </span>with a verification link. Please
            use that to verify your email address
          </p>
          <p className="onboarding-page-verify-spam">Did not receive an email? Check your spam folder</p>
          <div className="separator-onboarding">
            <div className=" separator">
              <h2>
                <span>OR</span>
              </h2>
            </div>
          </div>

          {!show && (
            <>
              <button
                className="verify-page-continue-btn  "
                style={{ marginTop: '26px' }}
                onClick={() => setResetBtn(true)}
                disabled={resendBtn}
              >
                <p className="mb-0 " id="resend">
                  Resend verification mail in 30s
                </p>
              </button>
              <button className="verify-page-continue-btn " style={{ marginTop: '12px' }} onClick={() => setShow(true)}>
                <p className="mb-0">Edit email address</p>
              </button>
            </>
          )}
          {show && (
            <>
              <label className=" common-auth-sub-label">Email address</label>
              <input
                // onChange={this.handleChange}
                name="email"
                type="email"
                className="common-input-auth-section"
                placeholder="Enter your business email"
              />
              <button
                className="verify-page-continue-btn "
                style={{ marginTop: '12px' }}
                // onClick={() => setShow(true)}
              >
                <p className="mb-0">Verify new email</p>
              </button>
              <p className="cancel-verification">Cancel</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuccessinfoScreen;
