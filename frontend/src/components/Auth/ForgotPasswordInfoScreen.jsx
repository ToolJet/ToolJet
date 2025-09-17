import * as React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function ForgotPasswordInfoScreen({ className, ...props }) {
  const {
    // Header
    headerText,

    // Message content
    messageText,
    email,

    // Info text
    infoText,
    showInfo,

    // Button
    buttonText,
    onBackToLogin,

    // Separator
    showSeparator,
  } = props;

  return (
    <FormWrapper>
      <div className={cn('tw-flex tw-flex-col tw-gap-6 tw-min-w-96', className)} {...props}>
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0" data-cy="forgot-password-info-header">
            {headerText}
          </h1>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-4">
          <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0" data-cy="forgot-password-message">
            {messageText}
            {email && (
              <>
                {' '}
                <span className="tw-font-medium tw-text-text-brand">{email}</span>
              </>
            )}
            .
          </p>

          {showInfo && (
            <p className="tw-text-sm tw-text-text-placeholder tw-mb-0" data-cy="forgot-password-info">
              {infoText}
            </p>
          )}

          {showSeparator && (
            <div className="tw-relative tw-flex tw-items-center tw-text-center tw-text-sm">
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
              <span className="tw-px-2 tw-text-muted-foreground">OR</span>
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
            </div>
          )}

          <Button
            size="default"
            variant="outline"
            className="tw-w-fit"
            onClick={onBackToLogin}
            data-cy="back-to-login-button"
          >
            <ArrowLeft width="16" height="16" />
            {buttonText}
          </Button>
        </div>
      </div>
    </FormWrapper>
  );
}

ForgotPasswordInfoScreen.propTypes = {
  className: PropTypes.string,

  // Header
  headerText: PropTypes.string,

  // Message content
  messageText: PropTypes.string,
  email: PropTypes.string,

  // Info text
  infoText: PropTypes.string,
  showInfo: PropTypes.bool,

  // Button
  buttonText: PropTypes.string,
  onBackToLogin: PropTypes.func,

  // Separator
  showSeparator: PropTypes.bool,
};

ForgotPasswordInfoScreen.defaultProps = {
  className: '',

  // Header
  headerText: 'Check your mail',

  // Message content
  messageText: "We've sent a password reset link to",
  email: '',

  // Info text
  infoText: 'Did not receive an email? Check your spam folder!',
  showInfo: true,

  // Button
  buttonText: 'Back to login',
  onBackToLogin: undefined,

  // Separator
  showSeparator: true,
};
