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
}) => {
  const prevDynamicHeight = useRef(dynamicHeight);
  const initialRender = useRef(true);

  useEffect(() => {
    if (dynamicHeight) {
      const element = document.querySelector(`.ele-${id}`);
      if (element) {
        element.style.height = 'auto';
        // Wait for the next frame to ensure the height has updated
        requestAnimationFrame(() => {
          adjustComponentPositions(id, currentLayout, false, isContainer, initialRender.current);
        });
      }
    } else if (!dynamicHeight && prevDynamicHeight.current) {
      const element = document.querySelector(`.ele-${id}`);
      if (element) {
        element.style.height = `${height}px`;
        requestAnimationFrame(() => {
          adjustComponentPositions(id, currentLayout, false, isContainer, initialRender.current);
        });
      }
    }
    prevDynamicHeight.current = dynamicHeight;
    initialRender.current = false;
  }, [dynamicHeight, id, value, adjustComponentPositions, currentLayout, height, width, isContainer]);

  return;
};
