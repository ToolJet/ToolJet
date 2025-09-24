import { useEffect, useRef } from 'react';

export const useDynamicHeight = ({
  dynamicHeight,
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
  const prevDynamicHeight = useRef(dynamicHeight);
  const prevHeight = useRef(height);
  const initialRender = useRef(true);

  useEffect(() => {
    const element = document.querySelector(`.ele-${id}`);
    if (!element) return;
    if (skipAdjustment && dynamicHeight) {
      element.style.height = `${prevHeight.current}px`;
    } else if (dynamicHeight) {
      element.style.height = 'auto';
      // Wait for the next frame to ensure the height has updated
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, false, isContainer, initialRender.current);
      });
    } else if (!dynamicHeight && prevDynamicHeight.current) {
      element.style.height = `${height}px`;
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, false, isContainer, initialRender.current);
      });
    }
    prevHeight.current = element.offsetHeight;
    prevDynamicHeight.current = dynamicHeight;
    initialRender.current = false;
  }, [
    dynamicHeight,
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
