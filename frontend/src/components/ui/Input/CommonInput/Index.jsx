import React, { useEffect, useState } from 'react';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import { HelperMessage, InputLabel, ValidationMessage } from '../InputUtils/InputUtils';

const CommonInput = ({ label, helperText, disabled, required, onChange: change, ...restProps }) => {
  const InputComponentType = restProps.type === 'number' ? NumberInput : TextInput;
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    if (restProps.validation) {
      const validateObj = restProps.validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
      change(e, validateObj);
    } else {
      change(e);
    }
  };

  useEffect(() => {
    if (restProps.isValidatedMessages) {
      setIsValid(restProps.isValidatedMessages.valid);
      setMessage(restProps.isValidatedMessages.message);
    }
  }, [restProps.isValidatedMessages]);

  return (
    <div>
      {label && <InputLabel disabled={disabled} label={label} required={required} />}
      <InputComponentType
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
      {(isValid === true || isValid === false) && !disabled && message !== '' && (
        <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[5px]" />
      )}
    </div>
  );
};

export default CommonInput;
