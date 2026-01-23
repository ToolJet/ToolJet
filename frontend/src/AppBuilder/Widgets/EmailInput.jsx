import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const EmailInput = (props) => {
  const inputLogic = useInput(props);
  const additionalInputProps = {
    autocomplete: 'email',
    name: 'email',
  };
  const showClearBtn = props.properties?.showClearBtn;
  const handleClear = () => {
    inputLogic.setInputValue('');
    props.fireEvent('onChange');
  };
  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType="email"
      additionalInputProps={additionalInputProps}
      showClearBtn={showClearBtn}
      onClear={handleClear}
    />
  );
};
