import * as React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CornerDownLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function ForgotPasswordForm({ className, ...props }) {
  const {
    // Header and sign up section
    headerText,
    signupText,
    signupUrl,
    signupCTA,
    showSignup,

    // Form fields
    emailLabel,
    emailPlaceholder,

    // Button
    buttonText,

    // Admin banner
    adminContactText,
    showAdminBanner,
    showSeparator,

    // Form functionality
    onSubmit,
    emailValue,
    onEmailChange,

    // Validation and state
    emailValidation,
    emailValidationMessage,
    isLoading,
    disabled,
  } = props;

  return (
    <FormWrapper>
      <form className={cn('tw-flex tw-flex-col tw-gap-6', className)} onSubmit={onSubmit} {...props}>
        <div className="tw-flex tw-flex-col tw-gap-0.5 tw-min-w-96">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0" data-cy="forgot-password-header">
            {headerText}
          </h1>

          {showSignup && (
            <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0">
              <span>{signupText}</span>
              <span>
                <Link
                  to={signupUrl}
                  className="tw-text-text-brand tw-text-[11px] tw-font-medium tw-no-underline tw-pl-1.5 tw-pb-0.5 tw-self-center hover:tw-text-button-primary-hover"
                  tabIndex="-1"
                  data-cy="create-an-account-link"
                >
                  {signupCTA}
                </Link>
              </span>
            </p>
          )}
        </div>

        <div className="tw-grid tw-gap-4">
          <div className="tw-grid tw-gap-0.5">
            <Label htmlFor="email" size="large">
              {emailLabel}
            </Label>
            <Input
              type="email"
              placeholder={emailPlaceholder}
              value={emailValue}
              onChange={onEmailChange}
              disabled={disabled}
              required
              validation={emailValidation}
              isValidatedMessages={emailValidationMessage}
              size="large"
            />
          </div>

          <Button
            size="large"
            type="submit"
            className="tw-w-fit"
            disabled={disabled || isLoading}
            isLoading={isLoading}
          >
            {buttonText}
            <CornerDownLeft width="16" height="16" />
          </Button>

          {showSeparator && (
            <div className="tw-relative tw-flex tw-items-center tw-text-center tw-text-sm">
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
              <span className="tw-px-2 tw-text-text-placeholder tw-text-lg tw-font-medium">OR</span>
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
            </div>
          )}

          {showAdminBanner && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-p-3 tw-bg-background-subtle tw-border tw-border-border-weak tw-rounded-md">
              <div className="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="tw-text-text-brand"
                  aria-label="Information icon"
                >
                  <title>Information</title>
                  <path
                    d="M8 1L9.5 2.5L8 4L6.5 2.5L8 1ZM8 12L6.5 13.5L8 15L9.5 13.5L8 12ZM1 8L2.5 6.5L4 8L2.5 9.5L1 8ZM12 8L13.5 9.5L15 8L13.5 6.5L12 8Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p className="tw-text-sm tw-text-text-placeholder tw-mb-0" data-cy="admin-contact-banner">
                {adminContactText}
              </p>
            </div>
          )}
        </div>
      </form>
    </FormWrapper>
  );
}

ForgotPasswordForm.propTypes = {
  className: PropTypes.string,

  // Header and sign up section
  headerText: PropTypes.string,
  signupText: PropTypes.string,
  signupUrl: PropTypes.string,
  signupCTA: PropTypes.string,
  showSignup: PropTypes.bool,

  // Form fields
  emailLabel: PropTypes.string,
  emailPlaceholder: PropTypes.string,

  // Button
  buttonText: PropTypes.string,

  // Admin banner
  adminContactText: PropTypes.string,
  showAdminBanner: PropTypes.bool,
  showSeparator: PropTypes.bool,

  // Form functionality
  onSubmit: PropTypes.func,
  emailValue: PropTypes.string,
  onEmailChange: PropTypes.func,

  // Validation and state
  emailValidation: PropTypes.func,
  emailValidationMessage: PropTypes.object,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

ForgotPasswordForm.defaultProps = {
  className: '',

  // Header and sign up section
  headerText: 'Forgot Password',
  signupText: 'New to ToolJet?',
  signupUrl: '#',
  signupCTA: 'Create an account',
  showSignup: true,

  // Form fields
  emailLabel: 'Email address',
  emailPlaceholder: 'Enter email address',

  // Button
  buttonText: 'Send a reset link',

  // Admin banner
  adminContactText: 'Contact admin to reset your password',
  showAdminBanner: true,
  showSeparator: true,

  // Form functionality
  onSubmit: undefined,
  emailValue: undefined,
  onEmailChange: undefined,

  // Validation and state
  emailValidation: undefined,
  emailValidationMessage: undefined,
  isLoading: false,
  disabled: false,
};
