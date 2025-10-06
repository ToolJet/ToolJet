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
}) => {
  const prevDynamicHeight = useRef(isDynamicHeightEnabled);
  const prevHeight = useRef(height);
  const initialRender = useRef(true);

  useEffect(() => {
    const element = document.querySelector(`.ele-${id}`);
    if (!element) return;
    if (skipAdjustment && isDynamicHeightEnabled) {
      element.style.height = `${prevHeight.current}px`;
    } else if (isDynamicHeightEnabled) {
      element.style.height = 'auto';
      // Wait for the next frame to ensure the height has updated
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, false, isContainer, initialRender.current);
      });
    } else if (!isDynamicHeightEnabled && prevDynamicHeight.current) {
      element.style.height = `${height}px`;
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, false, isContainer, initialRender.current);
      });
    }
    prevHeight.current = element.offsetHeight;
    prevDynamicHeight.current = isDynamicHeightEnabled;
    initialRender.current = false;
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
  ]);

  return;
};
