import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const TextInput = (props) => {
  const transformedProps = {
    ...props,
    inputType: 'TextInput',
  };
  const inputLogic = useInput(transformedProps);
  const showClearBtn = props.properties?.showClearBtn;
  const handleClear = () => {
    inputLogic.setInputValue('');
    props.fireEvent('onChange');
  };
  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType="text"
      showClearBtn={showClearBtn}
      onClear={handleClear}
    />
  );
};
