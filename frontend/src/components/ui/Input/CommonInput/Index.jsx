import React, { useEffect, useState } from 'react';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import { HelperMessage, InputLabel, ValidationMessage } from '../InputUtils/InputUtils';
import { ButtonSolid } from '../../../../_components/AppButton';
import { generateCypressDataCy } from '../../../../modules/common/helpers/cypressHelpers.js';

const CommonInput = ({ label, helperText, disabled, required, onChange: change, ...restProps }) => {
  const {
    propertyKey,
    type,
    encrypted,
    validation,
    isValidatedMessages,
    isDisabled,
    isEditing,
    handleEncryptedFieldsToggle,
  } = restProps;

  const InputComponentType = type === 'number' ? NumberInput : TextInput;
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  const isEncrypted = type === 'password' || encrypted;
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
      <div className="d-flex">
        {label && (
          <div className="tw-flex-shrink-0">
            <InputLabel disabled={disabled} label={label} required={required} />
          </div>
        )}
        {type === 'password' && (
          <div className="d-flex justify-content-between w-100">
            <div className="mx-1 col">
              <ButtonSolid
                className="datasource-edit-btn mb-2"
                type="a"
                variant="tertiary"
                target="_blank"
                rel="noreferrer"
                disabled={isDisabled}
                onClick={(e) => handleEncryptedFieldsToggle(e, propertyKey)}
                data-cy={`button-${generateCypressDataCy(isEditing ? 'Cancel' : 'Edit')}`}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </ButtonSolid>
            </div>

            <div className="col-auto mb-2">
              <small className="text-green" data-cy="encrypted-text">
                <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
                Encrypted
              </small>
            </div>
          </div>
        )}
      </div>
      <InputComponentType
        disabled={disabled || (isEncrypted && !isEditing)}
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
