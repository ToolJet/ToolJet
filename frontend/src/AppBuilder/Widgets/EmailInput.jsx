import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useControlledInput } from './BaseComponents/hooks/useControlledInput';

export const EmailInput = (props) => {
  const inputLogic = useControlledInput(props);
  const additionalInputProps = {
    autocomplete: 'email',
    name: 'email',
  };
  const showClearBtn = props.properties?.showClearBtn;
  const handleClear = () => {
    inputLogic.setInputValue('');
    props.fireEvent('onChange');
  };
  const getCustomStyles = (baseStyles) => {
    return {
      ...baseStyles,
      paddingRight: showClearBtn ? '25px' : '0px',
    };
  };
  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType="email"
      additionalInputProps={additionalInputProps}
      showClearBtn={showClearBtn}
      onClear={handleClear}
      getCustomStyles={getCustomStyles}
    />
  );
};
