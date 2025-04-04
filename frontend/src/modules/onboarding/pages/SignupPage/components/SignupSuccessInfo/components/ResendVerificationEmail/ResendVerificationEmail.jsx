import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import cx from 'classnames';
import './resources/resend-email-verification.styles.scss';

const ResendVerificationEmail = ({ email, organizationId, redirectTo }) => {
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);

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
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  return (
    <div className="back-to-signup-button">
      <button
        onClick={handleResend}
        className={cx('button-parent', { disabled: isResendDisabled })}
        disabled={isResendDisabled}
        data-cy={'resend-verification'}
      >
        <span className="button-text">
          {isResendDisabled ? `Resend verification email in ${countdown}s` : 'Resend verification email'}
        </span>
      </button>
    </div>
  );
};

export default ResendVerificationEmail;
