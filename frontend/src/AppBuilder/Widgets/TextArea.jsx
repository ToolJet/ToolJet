import React, { useLayoutEffect, useCallback } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';

export const TextArea = (props) => {
  const inputLogic = useInput(props);
  const {
    properties,
    height,
    width,
    id,
    adjustComponentPositions,
    currentLayout,
    currentMode,
    subContainerIndex,
    componentType,
  } = props;
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
    // `scrollHeight` = content + padding. We add just the 2px top/bottom
    // border so the outer box doesn't clip and trigger an unwanted scrollbar.
    // Previously +20 was used here, which padded every grown textarea with
    // an extra ~20px of empty space — visible as unexplained vertical slack.
    inputRef.current.style.height =
      height >= inputRef.current.scrollHeight ? `${height}px` : `${inputRef.current.scrollHeight + 2}px`;
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
    componentType,
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
