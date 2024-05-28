import React from 'react';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import { HelperMessage, InputLabel, ValidationMessage } from '../InputUtils/InputUtils';

const CommonInput = ({ label, helperText, disabled, required, onChange, ...restProps }) => {
  const InputComponent = restProps.type === 'number' ? NumberInput : TextInput;
  const [isValid, setIsValid] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleChange = (e) => {
    onChange(e);
    if (restProps.validation) {
      if (e.target.value === '') {
        setIsValid('');
        setMessage('');
        return;
      }
      const { valid, message } = restProps.validation(e.target.value);
      setIsValid(valid);
      setMessage(message);
    }
  };

  return (
    <div>
      {label && <InputLabel disabled={disabled} label={label} required={required} />}
      <InputComponent
        disabled={disabled}
        required={required}
        response={isValid}
        onChange={handleChange}
        {...restProps}
      />
      {helperText && (
        <HelperMessage
          helperText={helperText}
          className="tw-gap-[5px]"
          labelStyle={`${disabled ? 'tw-text-text-disabled' : ''}`}
        />
      )}
      {(isValid === 'true' || isValid === 'false') && !disabled && (
        <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[5px]" />
      )}
    </div>
  );
};

export default CommonInput;
