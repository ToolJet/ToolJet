import * as React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Mail } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function SignupSuccessInfo({ className, ...props }) {
  const {
    // Header
    headerText,

    // Message content
    messageText,
    email,
    name,

    // Info text
    infoText,
    showInfo,

    // Resend email
    resendButtonText,
    resendCountdownText,
    showResendButton,
    resendDisabled,
    resendCountdown,

    // Back button
    backButtonText,
    onBackToSignup,

    // Separator
    showSeparator,
  } = props;

  return (
    <FormWrapper>
      <div className={cn('tw-flex tw-flex-col tw-gap-6 tw-min-w-96', className)} {...props}>
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0" data-cy="signup-success-header">
            {headerText}
          </h1>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-4">
          <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0" data-cy="signup-success-message">
            {messageText}
            {email && (
              <>
                {' '}
                <span className="tw-font-medium tw-text-text-brand">{email}</span>
              </>
            )}
            .{' '}
            {name && (
              <>
                Welcome, <span className="tw-font-medium tw-text-text-brand">{name}</span>!
              </>
            )}
          </p>

          {showInfo && (
            <p className="tw-text-sm tw-text-text-placeholder tw-mb-0" data-cy="signup-success-info">
              {infoText}
            </p>
          )}

          {showSeparator && (
            <div className="tw-relative tw-flex tw-items-center tw-text-center tw-text-sm">
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
              <span className="tw-px-2 tw-text-text-placeholder tw-text-lg tw-font-medium">OR</span>
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
            </div>
          )}

          {showResendButton && (
            <Button
              size="default"
              variant="outline"
              className="tw-w-fit"
              disabled={resendDisabled}
              data-cy="resend-verification-email-button"
            >
              <Mail width="16" height="16" />
              {resendDisabled && resendCountdown > 0 ? `${resendCountdownText} ${resendCountdown}s` : resendButtonText}
            </Button>
          )}

          <Button
            size="default"
            variant="outline"
            className="tw-w-fit"
            onClick={onBackToSignup}
            data-cy="back-to-signup-button"
          >
            <ArrowLeft width="16" height="16" />
            {backButtonText}
          </Button>
        </div>
      </div>
    </FormWrapper>
  );
}

SignupSuccessInfo.propTypes = {
  className: PropTypes.string,

  // Header
  headerText: PropTypes.string,

  // Message content
  messageText: PropTypes.string,
  email: PropTypes.string,
  name: PropTypes.string,

  // Info text
  infoText: PropTypes.string,
  showInfo: PropTypes.bool,

  // Resend email
  resendButtonText: PropTypes.string,
  resendCountdownText: PropTypes.string,
  showResendButton: PropTypes.bool,
  resendDisabled: PropTypes.bool,
  resendCountdown: PropTypes.number,

  // Back button
  backButtonText: PropTypes.string,
  onBackToSignup: PropTypes.func,

  // Separator
  showSeparator: PropTypes.bool,
};

SignupSuccessInfo.defaultProps = {
  className: '',

  // Header
  headerText: 'Check your mail',

  // Message content
  messageText: "We've sent a verification email to",
  email: '',
  name: '',

  // Info text
  infoText: 'Did not receive an email? Check your spam folder!',
  showInfo: true,

  // Resend email
  resendButtonText: 'Resend verification email',
  resendCountdownText: 'Resend verification email in',
  showResendButton: true,
  resendDisabled: false,
  resendCountdown: 0,

  // Back button
  backButtonText: 'Back to sign up',
  onBackToSignup: undefined,

  // Separator
  showSeparator: true,
};
