import * as React from 'react';
import PropTypes from 'prop-types';
import { CornerDownLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function SetupAdminForm({ className, ...props }) {
  const {
    // Header
    headerText,

    // Form fields
    nameLabel,
    namePlaceholder,
    emailLabel,
    emailPlaceholder,
    passwordLabel,
    passwordPlaceholder,

    // Button
    buttonText,

    // Terms and privacy
    termsText,
    showTerms,

    // Form functionality
    onSubmit,
    nameValue,
    emailValue,
    passwordValue,
    onNameChange,
    onEmailChange,
    onPasswordChange,

    // Validation and state
    nameValidation,
    emailValidation,
    passwordValidation,
    nameValidationMessage,
    emailValidationMessage,
    passwordValidationMessage,
    isLoading,
    disabled,
  } = props;

  return (
    <FormWrapper>
      <form className={cn('tw-flex tw-flex-col tw-gap-6', className)} onSubmit={onSubmit} {...props}>
        <div className="tw-flex tw-flex-col tw-gap-0.5 tw-min-w-96">
          <h1 className="tw-text-4xl tw-tracking-tight tw-font-medium tw-mb-0" data-cy="setup-admin-header">
            {headerText}
          </h1>
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
            {buttonText}
            <CornerDownLeft width="16" height="16" />
          </Button>

          {showTerms && (
            <p className="tw-text-xs tw-text-text-placeholder tw-mb-0" data-cy="terms-and-privacy">
              {termsText}
            </p>
          )}
        </div>
      </form>
    </FormWrapper>
  );
}

SetupAdminForm.propTypes = {
  className: PropTypes.string,

  // Header
  headerText: PropTypes.string,

  // Form fields
  nameLabel: PropTypes.string,
  namePlaceholder: PropTypes.string,
  emailLabel: PropTypes.string,
  emailPlaceholder: PropTypes.string,
  passwordLabel: PropTypes.string,
  passwordPlaceholder: PropTypes.string,

  // Button
  buttonText: PropTypes.string,

  // Terms and privacy
  termsText: PropTypes.string,
  showTerms: PropTypes.bool,

  // Form functionality
  onSubmit: PropTypes.func,
  nameValue: PropTypes.string,
  emailValue: PropTypes.string,
  passwordValue: PropTypes.string,
  onNameChange: PropTypes.func,
  onEmailChange: PropTypes.func,
  onPasswordChange: PropTypes.func,

  // Validation and state
  nameValidation: PropTypes.func,
  emailValidation: PropTypes.func,
  passwordValidation: PropTypes.func,
  nameValidationMessage: PropTypes.object,
  emailValidationMessage: PropTypes.object,
  passwordValidationMessage: PropTypes.object,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

SetupAdminForm.defaultProps = {
  className: '',

  // Header
  headerText: 'Set up your admin account',

  // Form fields
  nameLabel: 'Name',
  namePlaceholder: 'Enter your name',
  emailLabel: 'Email',
  emailPlaceholder: 'Enter your work email',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter password',

  // Button
  buttonText: 'Sign up',

  // Terms and privacy
  termsText: 'By signing up, you agree to our Terms of Service and Privacy Policy',
  showTerms: true,

  // Form functionality
  onSubmit: undefined,
  nameValue: undefined,
  emailValue: undefined,
  passwordValue: undefined,
  onNameChange: undefined,
  onEmailChange: undefined,
  onPasswordChange: undefined,

  // Validation and state
  nameValidation: undefined,
  emailValidation: undefined,
  passwordValidation: undefined,
  nameValidationMessage: undefined,
  emailValidationMessage: undefined,
  passwordValidationMessage: undefined,
  isLoading: false,
  disabled: false,
};
