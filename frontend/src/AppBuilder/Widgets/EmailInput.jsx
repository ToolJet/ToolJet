import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const EmailInput = (props) => {
  const inputLogic = useInput(props);
  const additionalInputProps = {
    autocomplete: 'email',
    name: 'email',
  };
  return <BaseInput {...props} {...inputLogic} inputType="email" additionalInputProps={additionalInputProps} />;
};
