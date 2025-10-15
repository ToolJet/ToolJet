import React, { useEffect, useState } from 'react';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import PasswordInput from './PasswordInput';
import { HelperMessage, InputLabel, ValidationMessage } from '../InputUtils/InputUtils';

const CommonInput = ({ label, helperText, disabled, required, onChange: change, ...restProps }) => {
  const { type, validation, isValidatedMessages, labelDisabled } = restProps;

  const getInputComponent = () => {
    if (type === 'password') return PasswordInput;
    if (type === 'number') return NumberInput;
    return TextInput;
  };

  const InputComponentType = getInputComponent();
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  const isWorkspaceConstant =
    restProps.placeholder &&
    (restProps.placeholder.includes('{{constants') || restProps.placeholder.includes('{{secrets'));

  const handleChange = (e) => {
    if (validation) {
      const validateObj = validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
      change(e, validateObj);
    } else {
      change(e);
    }
  };

  useEffect(() => {
    if (isValidatedMessages) {
      setIsValid(isValidatedMessages.valid);
      setMessage(isValidatedMessages.message);
    }
  }, [isValidatedMessages]);

  useEffect(() => {
    if (isValid === true && (!isValidatedMessages || isValidatedMessages.valid === null)) {
      setIsValid(true);
    }
  }, [isValid, isValidatedMessages]);

  return (
    <div>
      {label && (
        <div className="d-flex">
          <div className="tw-flex-shrink-0">
            <InputLabel disabled={labelDisabled ?? disabled} label={label} required={required} />
          </div>
        </div>
      )}
      <InputComponentType
        disabled={disabled}
        required={required}
        response={isValid}
        onChange={handleChange}
        isWorkspaceConstant={isWorkspaceConstant}
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
