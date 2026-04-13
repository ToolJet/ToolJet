import { useEffect, useRef } from 'react';
import { isTruthyOrZero } from '@/_helpers/appUtils';

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
  componentType = '',
}) => {
  const prevDynamicHeight = useRef(isDynamicHeightEnabled);
  const prevHeight = useRef(height);

  useEffect(() => {
    const elementSelector =
      isTruthyOrZero(subContainerIndex) && componentType !== 'Listview'
        ? `.ele-${id}[subcontainer-id="${subContainerIndex}"]`
        : `.ele-${id}`;
    const element = document.querySelector(elementSelector);
    if (!element) return;
    if (skipAdjustment && isDynamicHeightEnabled) {
      element.style.height = `${prevHeight.current}px`;
    } else if (isDynamicHeightEnabled) {
      // For containers, height is calculated from child layout positions (not DOM measurement),
      // so we can adjust synchronously without setting height to 'auto' first.
      // This avoids a broken intermediate frame where 'auto' causes percentage-based children (height: 100%) to collapse before the real pixel height is set.
      // For non-containers, we need the element at 'auto' height so the DOM can be measured
      if (!isContainer) element.style.height = 'auto';
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
