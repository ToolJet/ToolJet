import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const EmailInput = (props) => {
  const inputLogic = useInput(props);
  const additionalInputProps = {
    autoComplete: 'email',
    name: 'email',
  };
  const showClearBtn = props.properties?.showClearBtn;
  const handleClear = () => {
    inputLogic.setInputValue('');
    // Clearing is a completed action, not a keystroke, so it reveals any resulting error the way a blur does.
    inputLogic.setShowValidationError(true);
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
