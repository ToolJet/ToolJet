import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  inEditorPreview,
}) => {
  const canvasMaxWidthValue = useStore((state) => state.globalSettings.canvasMaxWidth, shallow);
  const canvasMaxWidthType = useStore((state) => state.globalSettings.canvasMaxWidthType, shallow);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);

  // Desktop canvas width inside a `.canvas-container` that is `containerWidth` px wide.
  const getDesktopCanvasWidth = useCallback(
    (containerWidth) => {
      const pageSidebarWidth =
        !isPagesSidebarHidden && position === 'side'
          ? isViewerSidebarPinned
            ? PAGES_SIDEBAR_WIDTH_EXPANDED
            : PAGES_SIDEBAR_WIDTH_COLLAPSED
          : 0;
      const viewerWidth = containerWidth - (currentMode === 'edit' ? 16 : 0); // padding of 'div.canvas-container.page-container' container in editor is 16px (8px on each side)
      const canvasWidth = viewerWidth - pageSidebarWidth;
      if (canvasMaxWidthType === 'px') return canvasMaxWidthValue < canvasWidth ? canvasMaxWidthValue : canvasWidth;
      if (canvasMaxWidthType === '%') return (canvasMaxWidthValue / 100) * canvasWidth;
      return undefined;
    },
    [isPagesSidebarHidden, position, isViewerSidebarPinned, currentMode, canvasMaxWidthType, canvasMaxWidthValue]
  );

  // Entering or leaving a preview in the editor changes the canvas frame. The
  // width for the new frame is set in the same render as the mode, so widgets
  // render once per switch instead of again when the effect below measures the
  // new frame; that effect then lands on the same width and changes nothing.
  const [renderedPreview, setRenderedPreview] = useState(inEditorPreview);
  const editContainerWidth = useRef(null);
  if (renderedPreview !== inEditorPreview) {
    setRenderedPreview(inEditorPreview);
    if (moduleId === 'canvas' && currentLayout === 'desktop') {
      let containerWidth = editContainerWidth.current;
      if (inEditorPreview) {
        // The DOM still has the edit frame: keep its width for the way back.
        // The preview frame is fixed to the viewport at full width.
        editContainerWidth.current = document
          .querySelector('.canvas-container.page-container')
          ?.getBoundingClientRect()?.width;
        containerWidth = document.documentElement.clientWidth;
      }
      const width = containerWidth > 0 ? getDesktopCanvasWidth(containerWidth) : undefined;
      if (width) setCanvasWidth(width);
    }
  }

  const handleResizeImmediate = useCallback(() => {
    const _canvasWidth =
      moduleId === 'canvas'
        ? document.getElementById('real-canvas')?.getBoundingClientRect()?.width
        : document.getElementById(moduleId)?.getBoundingClientRect()?.width;
    if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
  }, [moduleId, setCanvasWidth]);

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
      const containerWidth = document.querySelector('.canvas-container.page-container')?.getBoundingClientRect()?.width;

      if (!containerWidth || containerWidth <= 0) {
        return;
      }

      const _canvasWidth = getDesktopCanvasWidth(containerWidth);

      if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
    }

    localStorage.setItem('isPagesSidebarPinned', isViewerSidebarPinned);
  }, [getDesktopCanvasWidth, isViewerSidebarPinned, currentLayout, moduleId, setCanvasWidth]);
};

export default useCanvasResizing;
