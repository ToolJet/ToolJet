import React, { useEffect } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

export const TextArea = (props) => {
  const inputLogic = useInput(props);
  const { properties, height, width, id, adjustComponentPositions, currentLayout } = props;
  const { inputRef, value } = inputLogic;

  const resizeTextArea = () => {
    if (!inputRef.current || !properties.dynamicHeight) {
      inputRef.current.style.height = `${height}px`;
      return;
    }
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${inputRef.current.scrollHeight + 20}px`;
  };

  useEffect(() => {
    resizeTextArea();
  }, [width, height, properties.dynamicHeight, value]);

  useDynamicHeight({
    dynamicHeight: properties.dynamicHeight,
    id,
    height,
    value,
    adjustComponentPositions,
    currentLayout,
    width,
  });

  return <BaseInput {...props} {...inputLogic} inputType="textarea" />;
};
