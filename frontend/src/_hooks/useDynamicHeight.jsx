import { useEffect, useRef } from 'react';

export const useDynamicHeight = ({
  isDynamicHeightEnabled,
  id,
  height,
  value,
  adjustComponentPositions,
  currentLayout,
  width,
  isContainer = false,
  componentCount = 0,
  visibility,
  skipAdjustment = false,
  subContainerIndex,
}) => {
  const prevDynamicHeight = useRef(isDynamicHeightEnabled);
  const prevHeight = useRef(height);

  useEffect(() => {
    const element = document.querySelector(`.ele-${id}`);
    if (!element) return;
    if (skipAdjustment && isDynamicHeightEnabled) {
      element.style.height = `${prevHeight.current}px`;
    } else if (isDynamicHeightEnabled) {
      element.style.height = 'auto';
      // Wait for the next frame to ensure the height has updated
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, isContainer, subContainerIndex);
      });
    } else if (!isDynamicHeightEnabled && prevDynamicHeight.current) {
      element.style.height = `${height}px`;
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, isContainer, subContainerIndex);
      });
    }
    prevHeight.current = element.offsetHeight;
    prevDynamicHeight.current = isDynamicHeightEnabled;
  }, [
    isDynamicHeightEnabled,
    id,
    value,
    adjustComponentPositions,
    currentLayout,
    height,
    width,
    isContainer,
    componentCount,
    visibility,
    skipAdjustment,
    subContainerIndex,
  ]);

  return;
};
