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

    // Use clientWidth (excludes border) and subtract both sides of padding
    const CONTAINER_PADDING = parseInt(padding) || 8;
    const availableWidth = containerRef.current.clientWidth - 2 * CONTAINER_PADDING;

    const measuredItems = measurementContainerRef.current?.children
      ? Array.from(measurementContainerRef.current.children)
      : [];

    if (measuredItems.length === 0) {
      setLinks({ visible: visibleMenuItems, overflow: [] });
      return;
    }

    // Match the CSS gap: 6px from navigation.scss .navigation-horizontal-list
    const FLEX_GAP = 6;
    const MORE_BUTTON_WIDTH = 80;

    let currentWidth = 0;
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

      if (currentWidth + widthNeeded + moreButtonSpace <= availableWidth) {
        finalVisible.push(item);
        currentWidth += widthNeeded;
      } else {
        finalOverflow.push(item);
      }
    }

    while (
      finalOverflow.length > 0 &&
      finalVisible.length > 0 &&
      currentWidth + MORE_BUTTON_WIDTH + FLEX_GAP > availableWidth
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

  // Recalculate on resize and observe container size changes
  useLayoutEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(calculateOverflow);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    // ResizeObserver catches container size changes that don't trigger window resize
    // (e.g., editor sidebar toggle, viewer layout settling)
    let resizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(calculateOverflow);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [calculateOverflow]);

  // Recalculate when width changes
  useEffect(() => {
    calculateOverflow();
  }, [width, calculateOverflow]);

  return links;
}
