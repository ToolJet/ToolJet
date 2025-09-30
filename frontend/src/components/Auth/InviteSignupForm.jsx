import * as React from 'react';
import PropTypes from 'prop-types';
import { CornerDownLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function InviteSignupForm({ className, ...props }) {
  const {
    // Header section
    headerText,
    descriptionText,

    // Form fields
    emailLabel,
    emailPlaceholder,
    emailValue,
    emailDisabled,

    passwordLabel,
    passwordPlaceholder,
    passwordValue,
    onPasswordChange,
    passwordValidation,
    passwordValidationMessage,

    // Button
    buttonText,

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
            {headerText}
          </h1>

          {descriptionText && (
            <p className="tw-text-balance tw-text-sm tw-text-text-placeholder tw-mb-0">{descriptionText}</p>
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
              disabled={emailDisabled || disabled}
              required
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
        </div>
      </form>
    </FormWrapper>
  );
}

InviteSignupForm.propTypes = {
  className: PropTypes.string,

  // Header section
  headerText: PropTypes.string,
  descriptionText: PropTypes.string,

  // Form fields
  emailLabel: PropTypes.string,
  emailPlaceholder: PropTypes.string,
  emailValue: PropTypes.string,
  emailDisabled: PropTypes.bool,

  passwordLabel: PropTypes.string,
  passwordPlaceholder: PropTypes.string,
  passwordValue: PropTypes.string,
  onPasswordChange: PropTypes.func,
  passwordValidation: PropTypes.func,
  passwordValidationMessage: PropTypes.object,

  // Button
  buttonText: PropTypes.string,

  // Form functionality
  onSubmit: PropTypes.func,

  // Validation and state
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

InviteSignupForm.defaultProps = {
  className: '',

  // Header section
  headerText: 'Sign up',
  descriptionText: '',

  // Form fields
  emailLabel: 'Email',
  emailPlaceholder: 'Enter your email',
  emailValue: '',
  emailDisabled: true,

  passwordLabel: 'Password',
  passwordPlaceholder: 'Create password',
  passwordValue: '',
  onPasswordChange: undefined,
  passwordValidation: undefined,
  passwordValidationMessage: undefined,

  // Button
  buttonText: 'Create account',

  // Form functionality
  onSubmit: undefined,

  // Validation and state
  isLoading: false,
  disabled: false,
};
