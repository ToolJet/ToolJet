import { debounce } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { PAGES_SIDEBAR_WIDTH_COLLAPSED, PAGES_SIDEBAR_WIDTH_EXPANDED } from '../appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const useCanvasResizing = ({
  setCanvasWidth,
  moduleId,
  currentLayout,
  canvasMaxWidth,
  isRightSidebarOpen,
  isViewerSidebarPinned,
  position,
  currentMode,
}) => {
  const canvasMaxWidthValue = useStore((state) => state.globalSettings.canvasMaxWidth, shallow);
  const canvasMaxWidthType = useStore((state) => state.globalSettings.canvasMaxWidthType, shallow);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);

  const handleResizeImmediate = useCallback(() => {
    const _canvasWidth =
      moduleId === 'canvas'
        ? document.getElementById('real-canvas')?.getBoundingClientRect()?.width
        : document.getElementById(moduleId)?.getBoundingClientRect()?.width;
    if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
  }, [moduleId]);

  useEffect(() => {
    const handleResize = debounce(handleResizeImmediate, 300);

    if (moduleId === 'canvas') {
      window.addEventListener('resize', handleResize);
    } else {
      const elem = document.getElementById(moduleId);
      const resizeObserver = new ResizeObserver(handleResize);
      if (elem) resizeObserver.observe(elem);

      return () => {
        if (elem) resizeObserver.unobserve(elem);
        resizeObserver.disconnect();
        handleResize.cancel();
      };
    }
    handleResizeImmediate();

    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [handleResizeImmediate, currentLayout, canvasMaxWidth, moduleId, isRightSidebarOpen]);

  // Update grid width based on the state of page menu navigation bar
  // Also, prevents visual jumps between component/canvas width change during page menu animations
  useEffect(() => {
    if (moduleId === 'canvas' && currentLayout === 'desktop') {
      const pageSidebarWidth =
        !isPagesSidebarHidden && position === 'side'
          ? isViewerSidebarPinned
            ? PAGES_SIDEBAR_WIDTH_EXPANDED
            : PAGES_SIDEBAR_WIDTH_COLLAPSED
          : 0;

      let _canvasWidth;

      const viewerWidth =
        document.querySelector('.canvas-container.page-container')?.getBoundingClientRect()?.width -
        (currentMode === 'edit' ? 16 : 0); // padding of 'div.canvas-container.page-container' container in editor is 8px

      const canvasWidth = viewerWidth - pageSidebarWidth;

      if (canvasMaxWidthType === 'px') {
        if (canvasMaxWidthValue < canvasWidth) _canvasWidth = canvasMaxWidthValue;
        else _canvasWidth = canvasWidth;
      } else if (canvasMaxWidthType === '%') {
        _canvasWidth = (canvasMaxWidthValue / 100) * canvasWidth;
      }

      if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
    }

    localStorage.setItem('isPagesSidebarPinned', isViewerSidebarPinned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isViewerSidebarPinned,
    position,
    currentLayout,
    isPagesSidebarHidden,
    currentMode,
    canvasMaxWidthType,
    canvasMaxWidthValue,
  ]);

  return <></>;
};

export default useCanvasResizing;
