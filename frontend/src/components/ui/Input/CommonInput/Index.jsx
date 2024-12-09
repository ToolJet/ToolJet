import React, { useState } from 'react';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import { HelperMessage, InputLabel, ValidationMessage } from '../InputUtils/InputUtils';

const CommonInput = ({ label, helperText, disabled, required, ...restProps }) => {
  const InputComponentType = restProps.type === 'number' ? NumberInput : TextInput;
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    let validateObj;
    if (restProps.validation) {
      validateObj = restProps.validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
    }
    restProps.onChange(e, validateObj);
  };

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
