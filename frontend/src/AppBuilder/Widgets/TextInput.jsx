import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const TextInput = (props) => {
  const transformedProps = {
    ...props,
    inputType: 'TextInput',
  };
  const inputLogic = useInput(transformedProps);

  return <BaseInput {...props} {...inputLogic} inputType="text" />;
};
