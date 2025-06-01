import { useEffect, useState, useCallback } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { CANVAS_WIDTHS, DEFAULT_CANVAS_WIDTH } from './appCanvasConstants';
import debounce from 'lodash/debounce';

const useAppCanvasMaxWidth = ({ mode }) => {
  const canvasMaxWidth = useStore((state) => state.globalSettings.canvasMaxWidth, shallow);
  const canvasMaxWidthType = useStore((state) => state.globalSettings.canvasMaxWidthType, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned, shallow);
  let [maxWidth, setMaxWidth] = useState(0);

  const getEditorCanvasWidth = useCallback(() => {
    let _maxWidth;
    const windowWidth = window.innerWidth;
    const widthInPx = windowWidth - (CANVAS_WIDTHS.leftSideBarWidth + (isRightSidebarPinned ? 340 : 40));

    if (canvasMaxWidthType === 'px') {
      _maxWidth = +canvasMaxWidth;
    }
    if (canvasMaxWidthType === '%') {
      _maxWidth = (widthInPx / 100) * +canvasMaxWidth;
    }
    setMaxWidth(_maxWidth);
  }, [canvasMaxWidth, canvasMaxWidthType, isRightSidebarOpen, isRightSidebarPinned]);

  const getViewerWidth = useCallback(() => {
    let _maxWidth;
    if (canvasMaxWidthType === 'px') {
      _maxWidth =
        (canvasMaxWidth || DEFAULT_CANVAS_WIDTH) - (localStorage.getItem('isPagesSidebarPinned') === 'true' ? 200 : 0);
    }
    if (canvasMaxWidthType === '%') {
      _maxWidth = canvasMaxWidth + '%';
    }
    setMaxWidth(_maxWidth);
  }, [canvasMaxWidth, canvasMaxWidthType]);

  //
  const debouncedGetCanvasWidth = useCallback(debounce(getEditorCanvasWidth, 250), [getEditorCanvasWidth]);

  useEffect(() => {
    if (mode === 'edit') {
      window.addEventListener('resize', debouncedGetCanvasWidth);
      getEditorCanvasWidth(); // Initial call without debounce
    } else {
      getViewerWidth();
    }

    return () => {
      if (mode === 'edit') {
        window.removeEventListener('resize', debouncedGetCanvasWidth);
        debouncedGetCanvasWidth.cancel(); // Cancel any pending debounced calls
      }
    };
  }, [debouncedGetCanvasWidth, getEditorCanvasWidth, getViewerWidth, mode, isRightSidebarOpen, isRightSidebarPinned]);

  return maxWidth;
};

export default useAppCanvasMaxWidth;
