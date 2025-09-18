import * as React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CornerDownLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function LoginForm({ className, ...props }) {
  const {
    // Header and sign up section
    signinHeader,
    signUpText,
    signUpUrl,
    signUpCTA,
    showSignup,
    organizationName,

    // Form fields
    emailLabel,
    emailPlaceholder,
    passwordLabel,
    passwordPlaceholder,

    // Forgot password
    showForgotPassword,
    forgotPasswordUrl,
    forgotPasswordText,

    // Button and separator
    signinButtonText,
    orText,
    showOrSeparator,

    // Form functionality
    onSubmit,
    emailValue,
    passwordValue,
    onEmailChange,
    onPasswordChange,

    // Validation and state
    emailValidation,
    passwordValidation,
    emailValidationMessage,
    passwordValidationMessage,
    isLoading,
    disabled,
  } = props;
  return (
    <FormWrapper>
      <form className={cn('tw-flex tw-flex-col tw-gap-6', className)} onSubmit={onSubmit} {...props}>
        <div className="tw-flex tw-flex-col tw-gap-0.5 tw-min-w-96">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0" data-cy="">
            {signinHeader}
          </h1>

          {(organizationName || showSignup) && (
            <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0">
              {organizationName && (
                <>
                  Sign in to the workspace -{' '}
                  <span className="tw-font-medium" data-cy="workspace-name">
                    {organizationName}
                  </span>
                  .
                </>
              )}{' '}
              {showSignup && (
                <>
                  <span>{signUpText}</span>
                  <span>
                    <Link
                      to={signUpUrl}
                      className="tw-text-text-brand tw-text-[11px] tw-font-medium tw-no-underline tw-pl-1.5 tw-pb-0.5 tw-self-center hover:tw-text-button-primary-hover"
                      tabIndex="-1"
                      data-cy="create-an-account-link"
                    >
                      {signUpCTA}
                    </Link>
                  </span>
                </>
              )}
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
          <div className="tw-grid tw-gap-0.5">
            <div className="tw-flex tw-items-center tw-justify-between">
              <Label htmlFor="password" size="large">
                {passwordLabel}
              </Label>
              {showForgotPassword && (
                <Link
                  to={forgotPasswordUrl}
                  tabIndex="-1"
                  className="tw-text-text-brand tw-text-[11px] tw-font-medium tw-no-underline tw-pl-1.5 tw-pb-0.5 tw-self-center hover:tw-text-button-primary-hover"
                  data-cy="forgot-password-link"
                >
                  {forgotPasswordText}
                </Link>
              )}
            </div>
            <Input
              type="password"
              placeholder={passwordPlaceholder}
              value={passwordValue}
              onChange={onPasswordChange}
              disabled={disabled}
              showEncryption={false}
              required
              validation={passwordValidation}
              isValidatedMessages={passwordValidationMessage}
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
            {signinButtonText}
            <CornerDownLeft width="16" height="16" />
          </Button>
          {showOrSeparator && (
            <div className="tw-relative tw-flex tw-items-center tw-text-center tw-text-sm">
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
              <span className="tw-px-2 tw-text-muted-foreground">{orText}</span>
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
            </div>
          )}
        </div>
      </form>
    </FormWrapper>
  );
}

LoginForm.propTypes = {
  className: PropTypes.string,

  // Header and sign up section
  signinHeader: PropTypes.string,
  signUpText: PropTypes.string,
  signUpUrl: PropTypes.string,
  signUpCTA: PropTypes.string,
  showSignup: PropTypes.bool,
  organizationName: PropTypes.string,
  // Form fields
  emailLabel: PropTypes.string,
  emailPlaceholder: PropTypes.string,
  passwordLabel: PropTypes.string,

  // Forgot password
  showForgotPassword: PropTypes.bool,
  forgotPasswordUrl: PropTypes.string,
  forgotPasswordText: PropTypes.string,

  // Button and separator
  signinButtonText: PropTypes.string,
  orText: PropTypes.string,
  showOrSeparator: PropTypes.bool,

  // Form functionality
  onSubmit: PropTypes.func,
  emailValue: PropTypes.string,
  passwordValue: PropTypes.string,
  onEmailChange: PropTypes.func,
  onPasswordChange: PropTypes.func,

  // Validation and state
  emailValidation: PropTypes.func,
  passwordValidation: PropTypes.func,
  emailValidationMessage: PropTypes.object,
  passwordValidationMessage: PropTypes.object,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

LoginForm.defaultProps = {
  className: '',

  // Header and sign up section
  signinHeader: 'Sign in',
  signUpText: 'New to ToolJet?',
  signUpUrl: '#',
  signUpCTA: 'Create an account',
  showSignup: true,
  organizationName: '',
  // Form fields
  emailLabel: 'Email',
  emailPlaceholder: 'Enter your work email',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter password',

  // Forgot password
  showForgotPassword: true,
  forgotPasswordUrl: '/forgot-password',
  forgotPasswordText: 'Forgot?',

  // Button and separator
  signinButtonText: 'Sign in',
  orText: 'OR',
  showOrSeparator: true,

  // Form functionality
  onSubmit: undefined,
  emailValue: undefined,
  passwordValue: undefined,
  onEmailChange: undefined,
  onPasswordChange: undefined,

  // Validation and state
  emailValidation: undefined,
  passwordValidation: undefined,
  emailValidationMessage: undefined,
  passwordValidationMessage: undefined,
  isLoading: false,
  disabled: false,
};
