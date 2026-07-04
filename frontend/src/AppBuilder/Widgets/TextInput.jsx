import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useControlledInput } from './BaseComponents/hooks/useControlledInput';

export const TextInput = (props) => {
  const inputLogic = useControlledInput(props);
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
      inputType="text"
      showClearBtn={showClearBtn}
      onClear={handleClear}
      getCustomStyles={getCustomStyles}
    />
  );
};
