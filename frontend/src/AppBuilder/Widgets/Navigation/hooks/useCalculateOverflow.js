import { useState, useCallback, useEffect, useLayoutEffect } from 'react';

export function useCalculateOverflow({ containerRef, measurementContainerRef, visibleMenuItems, orientation, padding, width }) {
  const [links, setLinks] = useState({
    visible: visibleMenuItems,
    overflow: [],
  });

  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || visibleMenuItems.length === 0) {
      setLinks({ visible: [], overflow: [] });
      return;
    }

    if (orientation !== 'horizontal') {
      setLinks({ visible: visibleMenuItems, overflow: [] });
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const measuredItems = measurementContainerRef.current?.children
      ? Array.from(measurementContainerRef.current.children)
      : [];

    if (measuredItems.length === 0) {
      setLinks({ visible: visibleMenuItems, overflow: [] });
      return;
    }

    const FLEX_GAP = 4;
    const MORE_BUTTON_WIDTH = 80;
    const CONTAINER_PADDING = parseInt(padding) || 8;

    let currentWidth = CONTAINER_PADDING;
    const finalVisible = [];
    const finalOverflow = [];

    for (let i = 0; i < visibleMenuItems.length; i++) {
      const item = visibleMenuItems[i];
      const measuredElement = measuredItems.find((el) => el.dataset.id === item.id);

      if (!measuredElement) {
        finalOverflow.push(item);
        continue;
      }

      const itemWidth = measuredElement.offsetWidth;
      const widthNeeded = itemWidth + (finalVisible.length > 0 ? FLEX_GAP : 0);

      const remainingItems = visibleMenuItems.length - (i + 1);
      const needsMoreButton = remainingItems > 0 || finalOverflow.length > 0;
      const moreButtonSpace = needsMoreButton ? MORE_BUTTON_WIDTH + FLEX_GAP : 0;

      if (currentWidth + widthNeeded + moreButtonSpace <= containerWidth) {
        finalVisible.push(item);
        currentWidth += widthNeeded;
      } else {
        finalOverflow.push(item);
      }
    }

    while (
      finalOverflow.length > 0 &&
      finalVisible.length > 0 &&
      currentWidth + MORE_BUTTON_WIDTH + FLEX_GAP > containerWidth
    ) {
      const lastVisible = finalVisible.pop();
      const lastMeasured = measuredItems.find((el) => el.dataset.id === lastVisible.id);
      if (lastMeasured) {
        currentWidth -= lastMeasured.offsetWidth + (finalVisible.length > 0 ? FLEX_GAP : 0);
      }
      finalOverflow.unshift(lastVisible);
    }

    setLinks({ visible: finalVisible, overflow: finalOverflow });
  }, [visibleMenuItems, orientation, padding]);

  // Recalculate on resize
  useLayoutEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(calculateOverflow);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOverflow]);

  // Recalculate when width changes
  useEffect(() => {
    calculateOverflow();
  }, [width, calculateOverflow]);

  return links;
}
