import * as React from 'react';
import PropTypes from 'prop-types';
import { CornerDownLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormWrapper } from '@/components/Auth/FormWrapper';
import { GoogleSigninButton } from '@/components/Auth/GoogleSigninButton';
import { GitHubSigninButton } from '@/components/Auth/GitHubSigninButton';

export function SignupFormWithSSO({ className, ...props }) {
  const {
    // Header and sign in section
    signupHeader,
    signinText,
    signinUrl,
    signinCTA,
    showSignin,
    organizationName,

    // Form fields
    nameLabel,
    namePlaceholder,
    nameValue,
    onNameChange,
    nameValidation,
    nameValidationMessage,

    emailLabel,
    emailPlaceholder,
    emailValue,
    onEmailChange,
    emailValidation,
    emailValidationMessage,

    passwordLabel,
    passwordPlaceholder,
    passwordValue,
    onPasswordChange,
    passwordValidation,
    passwordValidationMessage,

    // Button and separator
    signupButtonText,
    orText,
    showOrSeparator,

    // SSO buttons
    showSSOButtons,
    googleButtonText,
    githubButtonText,
    onGoogleSignup,
    onGitHubSignup,

    // Form functionality
    onSubmit,

    // Validation and state
    isLoading,
    disabled,
  } = props;

  return (
    <FormWrapper>
      <form className={cn('tw-flex tw-flex-col tw-gap-6', className)} onSubmit={onSubmit} {...props}>
        <div className="tw-flex tw-flex-col tw-gap-2 tw-min-w-20">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0" data-cy="">
            {signupHeader}
          </h1>

          {(organizationName || showSignin) && (
            <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0">
              {organizationName && (
                <>
                  Join the workspace -{' '}
                  <span className="tw-font-medium" data-cy="workspace-name">
                    {organizationName}
                  </span>
                  .
                </>
              )}{' '}
              {showSignin && (
                <>
                  <span>{signinText}</span>
                  <span>
                    <a
                      href={signinUrl}
                      className="tw-text-text-brand tw-text-[11px] tw-font-medium tw-no-underline tw-pl-1.5 tw-pb-0.5 tw-self-center hover:tw-text-button-primary-hover"
                      tabIndex="-1"
                      data-cy="sign-in-link"
                    >
                      {signinCTA}
                    </a>
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="tw-grid tw-gap-4">
          <div className="tw-grid tw-gap-0.5">
            <Label htmlFor="name" size="large">
              {nameLabel}
            </Label>
            <Input
              type="text"
              placeholder={namePlaceholder}
              value={nameValue}
              onChange={onNameChange}
              disabled={disabled}
              required
              validation={nameValidation}
              isValidatedMessages={nameValidationMessage}
              size="large"
            />
          </div>

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
            <Label htmlFor="password" size="large">
              {passwordLabel}
            </Label>
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
            {signupButtonText}
            <CornerDownLeft width="16" height="16" />
          </Button>

          {showOrSeparator && (
            <div className="tw-relative tw-flex tw-items-center tw-text-center tw-text-sm">
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
              <span className="tw-px-2 tw-text-muted-foreground">{orText}</span>
              <div className="tw-flex-1 tw-h-px tw-bg-border-weak" />
            </div>
          )}

          {showSSOButtons && (
            <div className="tw-flex tw-flex-col tw-gap-3">
              <GoogleSigninButton onClick={onGoogleSignup} text={googleButtonText} dataCy="google-signup-button" />
              <GitHubSigninButton onClick={onGitHubSignup} text={githubButtonText} dataCy="github-signup-button" />
            </div>
          )}
        </div>
      </form>
    </FormWrapper>
  );
}

SignupFormWithSSO.propTypes = {
  className: PropTypes.string,

  // Header and sign in section
  signupHeader: PropTypes.string,
  signinText: PropTypes.string,
  signinUrl: PropTypes.string,
  signinCTA: PropTypes.string,
  showSignin: PropTypes.bool,
  organizationName: PropTypes.string,

  // Form fields
  nameLabel: PropTypes.string,
  namePlaceholder: PropTypes.string,
  nameValue: PropTypes.string,
  onNameChange: PropTypes.func,
  nameValidation: PropTypes.func,
  nameValidationMessage: PropTypes.object,

  emailLabel: PropTypes.string,
  emailPlaceholder: PropTypes.string,
  emailValue: PropTypes.string,
  onEmailChange: PropTypes.func,
  emailValidation: PropTypes.func,
  emailValidationMessage: PropTypes.object,

  passwordLabel: PropTypes.string,
  passwordPlaceholder: PropTypes.string,
  passwordValue: PropTypes.string,
  onPasswordChange: PropTypes.func,
  passwordValidation: PropTypes.func,
  passwordValidationMessage: PropTypes.object,

  // Button and separator
  signupButtonText: PropTypes.string,
  orText: PropTypes.string,
  showOrSeparator: PropTypes.bool,

  // SSO buttons
  showSSOButtons: PropTypes.bool,
  googleButtonText: PropTypes.string,
  githubButtonText: PropTypes.string,
  onGoogleSignup: PropTypes.func,
  onGitHubSignup: PropTypes.func,

  // Form functionality
  onSubmit: PropTypes.func,

  // Validation and state
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

SignupFormWithSSO.defaultProps = {
  className: '',

  // Header and sign in section
  signupHeader: 'Sign up',
  signinText: 'Already have an account?',
  signinUrl: '/login',
  signinCTA: 'Sign in',
  showSignin: true,
  organizationName: '',

  // Form fields
  nameLabel: 'Name',
  namePlaceholder: 'Enter your full name',
  nameValue: '',
  onNameChange: undefined,
  nameValidation: undefined,
  nameValidationMessage: undefined,

  emailLabel: 'Email',
  emailPlaceholder: 'Enter your work email',
  emailValue: '',
  onEmailChange: undefined,
  emailValidation: undefined,
  emailValidationMessage: undefined,

  passwordLabel: 'Password',
  passwordPlaceholder: 'Create password',
  passwordValue: '',
  onPasswordChange: undefined,
  passwordValidation: undefined,
  passwordValidationMessage: undefined,

  // Button and separator
  signupButtonText: 'Sign up',
  orText: 'OR',
  showOrSeparator: true,

  // SSO buttons
  showSSOButtons: true,
  googleButtonText: 'Sign up with',
  githubButtonText: 'Sign up with',
  onGoogleSignup: undefined,
  onGitHubSignup: undefined,

  // Form functionality
  onSubmit: undefined,

  // Validation and state
  isLoading: false,
  disabled: false,
};
