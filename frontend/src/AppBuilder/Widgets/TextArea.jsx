import React, { useLayoutEffect, useCallback } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { isDynamicHeightActive } from '@/AppBuilder/_stores/dynamicHeight/flags';

export const TextArea = (props) => {
  const inputLogic = useInput(props);
  const { properties, height, width, id, currentLayout, currentMode, subContainerIndex, componentType } = props;
  const { inputRef, value } = inputLogic;
  const isDynamicHeightEnabled = isDynamicHeightActive(properties.dynamicHeight, currentMode);

  const heightChangeValue = useHeightObserver(inputRef, isDynamicHeightEnabled);
  const resizeTextArea = useCallback(() => {
    if (!inputRef.current) return;
    if (!isDynamicHeightEnabled) {
      inputRef.current.style.height = '100%';
      return;
    }
    // A field its parent hides (collapsed accordion, inactive tab) has no box and
    // measures as empty; keep the height it had when last shown.
    const isHidden = inputRef.current.getClientRects().length === 0;
    if (isHidden && inputRef.current.style.height.endsWith('px')) return;
    inputRef.current.style.height = 'auto';
    // Subtract the input container's padding + border so the outer wrapper
    // matches the authored widget height when content fits. Without this,
    // wrapper = textarea + container padding/border, making dynamic-height
    // textareas visibly taller than non-dynamic ones.
    const container = inputRef.current.parentElement;
    const cs = container ? window.getComputedStyle(container) : null;
    const containerPaddingAndBorder = cs
      ? parseFloat(cs.paddingTop) +
        parseFloat(cs.paddingBottom) +
        parseFloat(cs.borderTopWidth) +
        parseFloat(cs.borderBottomWidth)
      : 0;
    const effectiveMax = Math.max(height - containerPaddingAndBorder, 0);
    inputRef.current.style.height =
      effectiveMax >= inputRef.current.scrollHeight ? `${effectiveMax}px` : `${inputRef.current.scrollHeight}px`;
  }, [inputRef?.current, height, isDynamicHeightEnabled]);

  useLayoutEffect(() => {
    resizeTextArea();
  }, [width, height, isDynamicHeightEnabled, properties.placeholder, value, heightChangeValue]);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
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
