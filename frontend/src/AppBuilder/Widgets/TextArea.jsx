import React, { useEffect } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

export const TextArea = (props) => {
  const inputLogic = useInput(props);
  const { properties, height, width, id, adjustComponentPositions, currentLayout, currentMode } = props;
  const { inputRef, value } = inputLogic;
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  const resizeTextArea = () => {
    if (!inputRef.current || !isDynamicHeightEnabled) {
      inputRef.current.style.height = `${height}px`;
      return;
    }
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${inputRef.current.scrollHeight + 20}px`;
  };

  useEffect(() => {
    if (!isDynamicHeightEnabled) return;
    resizeTextArea();
  }, [width, height, isDynamicHeightEnabled, properties.placeholder, value]);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: JSON.stringify({ value, placeholder: properties.placeholder }),
    adjustComponentPositions,
    currentLayout,
    width,
    visibility: inputLogic.visibility,
  });

  return <BaseInput {...props} {...inputLogic} isDynamicHeightEnabled={isDynamicHeightEnabled} inputType="textarea" />;
};
