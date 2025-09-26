import { useEffect, useMemo, useCallback, useRef } from 'react';

export const useGroupedTargetsScrollHandler = (groupedTargets, boxList, moveableRef) => {
  const scrollRAF = useRef(null); // // Stores the requestAnimationFrame ID

  const parentCanvasId = useMemo(() => {
    if (!groupedTargets?.[0] || groupedTargets.length === 0) return null;

    const targetId = groupedTargets[0].replace('.ele-', '');
    const targetBox = boxList.find((box) => box.id === targetId);
    return targetBox?.parent || null;
  }, [groupedTargets, boxList]);

  const containerId = useMemo(() => {
    return parentCanvasId ? `canvas-${parentCanvasId}` : null;
  }, [parentCanvasId]);

  const scrollHandler = useCallback(() => {
    if (!scrollRAF.current) {
      scrollRAF.current = requestAnimationFrame(() => {
        if (groupedTargets.length > 1 && moveableRef.current) {
          moveableRef.current.updateRect();
        }
        scrollRAF.current = null;
      });
    }
  }, [groupedTargets.length, moveableRef]);

  useEffect(() => {
    // Early return if no container ID or not enough grouped targets
    if (!containerId || groupedTargets.length <= 1) {
      return;
    }

    const canvasContainer = document.getElementById(containerId);
    if (!canvasContainer) {
      return;
    }

    canvasContainer.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      canvasContainer.removeEventListener('scroll', scrollHandler);
      if (scrollRAF.current) {
        cancelAnimationFrame(scrollRAF.current);
      }
    };
  }, [containerId, groupedTargets.length, scrollHandler]);
};
