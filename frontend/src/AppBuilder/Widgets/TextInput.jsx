import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const TextInput = (props) => {
  const inputLogic = useInput(props);

  return <BaseInput {...props} {...inputLogic} inputType="text" />;
};
