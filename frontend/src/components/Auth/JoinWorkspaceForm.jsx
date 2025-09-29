import * as React from 'react';
import PropTypes from 'prop-types';
import { CornerDownLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormWrapper } from '@/components/Auth/FormWrapper';

export function JoinWorkspaceForm({ className, ...props }) {
  const {
    // Header section
    headerText,
    descriptionText,

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
        <div className="tw-flex tw-flex-col tw-gap-2">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-text-default">{headerText}</h1>
          {descriptionText && <p className="tw-text-sm tw-text-text-muted">{descriptionText}</p>}
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

JoinWorkspaceForm.propTypes = {
  className: PropTypes.string,

  // Header section
  headerText: PropTypes.string,
  descriptionText: PropTypes.string,

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

  // Button
  buttonText: PropTypes.string,

  // Form functionality
  onSubmit: PropTypes.func,

  // Validation and state
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

JoinWorkspaceForm.defaultProps = {
  className: '',

  // Header section
  headerText: 'Join workspace',
  descriptionText: '',

  // Form fields
  nameLabel: 'Name',
  namePlaceholder: 'Enter your name',
  nameValue: '',
  onNameChange: undefined,
  nameValidation: undefined,
  nameValidationMessage: undefined,

  emailLabel: 'Email',
  emailPlaceholder: 'Enter your email',
  emailValue: '',
  onEmailChange: undefined,
  emailValidation: undefined,
  emailValidationMessage: undefined,

  // Button
  buttonText: 'Accept Invite',

  // Form functionality
  onSubmit: undefined,

  // Validation and state
  isLoading: false,
  disabled: false,
};
