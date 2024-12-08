import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const TextareaV2 = (props) => {
  const inputLogic = useInput(props);

  return <BaseInput {...props} {...inputLogic} inputType="textarea" />;
};
