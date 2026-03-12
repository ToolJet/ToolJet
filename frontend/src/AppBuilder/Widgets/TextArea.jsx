import React, { useLayoutEffect, useCallback } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';

export const TextArea = (props) => {
  const inputLogic = useInput(props);
  const { properties, height, width, id, adjustComponentPositions, currentLayout, currentMode, subContainerIndex } =
    props;
  const { inputRef, value } = inputLogic;
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  const heightChangeValue = useHeightObserver(inputRef, isDynamicHeightEnabled);
  const resizeTextArea = useCallback(() => {
    if (!inputRef.current) return;
    if (!isDynamicHeightEnabled) {
      inputRef.current.style.height = '100%';
      return;
    }
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height =
      height >= inputRef.current.scrollHeight ? `${height}px` : `${inputRef.current.scrollHeight + 20}px`;
  }, [inputRef?.current, height, isDynamicHeightEnabled]);

  useLayoutEffect(() => {
    resizeTextArea();
  }, [width, height, isDynamicHeightEnabled, properties.placeholder, value, heightChangeValue]);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility: inputLogic.visibility,
    subContainerIndex,
  });

  return (
    <BaseInput
      {...props}
      {...inputLogic}
      isDynamicHeightEnabled={isDynamicHeightEnabled}
      inputType="textarea"
      classes={{ leftIcon: 'tw-mt-0.5', loaderContainer: 'tw-mt-0.5' }}
    />
  );
};
