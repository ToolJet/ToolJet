import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/Input/Input.jsx';

import { cn } from '@/lib/utils';
import { HelperMessage, ValidationMessage } from '@/components/ui/Input/InputUtils/InputUtils';
import { usePasswordInput } from '@/hooks/usePasswordInput';

export const PasswordInput = ({
  placeholder = 'Create a password',
  value,
  onChange,
  error,
  name = 'password',
  dataCy = 'password',
  minLength = 5,
  hint = `Password must be at least ${minLength} characters`,
  disabled = false,
  className,
  validation,
  isValidatedMessages,
  required = true,
  ...props
}) => {
  const { isValid, message, handleChange } = usePasswordInput({
    onChange,
    validation,
    isValidatedMessages,
  });

  return (
    <div className={cn('tw-mb-0', className)}>
      <div className="tw-relative">
        <Input
          type="password"
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          required={required}
          minLength={minLength}
          disabled={disabled}
          data-cy={`${dataCy}-input`}
          {...props}
        />
      </div>

      {hint && !error && (
        <HelperMessage
          helperText={hint}
          className="tw-gap-[5px]"
          labelStyle={`${disabled ? 'tw-text-text-disabled' : ''}`}
        />
      )}

      {error && <ValidationMessage response={false} validationMessage={error} className="tw-gap-[5px]" />}

      {(isValid === true || isValid === false) && !disabled && message !== '' && (
        <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[5px]" />
      )}
    </div>
  );
};

PasswordInput.displayName = 'PasswordInput';

PasswordInput.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  name: PropTypes.string,
  dataCy: PropTypes.string,
  minLength: PropTypes.number,
  hint: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  validation: PropTypes.func,
  isValidatedMessages: PropTypes.shape({
    valid: PropTypes.bool,
    message: PropTypes.string,
  }),
  required: PropTypes.bool,
};

PasswordInput.defaultProps = {
  placeholder: 'Create a password',
  value: undefined,
  onChange: undefined,
  error: undefined,
  name: 'password',
  dataCy: 'password',
  minLength: 5,
  hint: undefined,
  disabled: false,
  className: undefined,
  validation: undefined,
  isValidatedMessages: undefined,
  required: true,
};

export default PasswordInput;
