import { useEffect, useState, useCallback } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DEFAULT_CANVAS_WIDTH } from '../appCanvasConstants';
import debounce from 'lodash/debounce';

const useAppCanvasMaxWidth = () => {
  const canvasMaxWidth = useStore((state) => state.globalSettings.canvasMaxWidth, shallow);
  const canvasMaxWidthType = useStore((state) => state.globalSettings.canvasMaxWidthType, shallow);

  let [maxWidth, setMaxWidth] = useState(0);

  const getCanvasMaxWidth = useCallback(() => {
    let _maxWidth;

    if (canvasMaxWidthType === 'px') _maxWidth = (canvasMaxWidth || DEFAULT_CANVAS_WIDTH) + 'px';
    if (canvasMaxWidthType === '%') _maxWidth = canvasMaxWidth + '%';

    setMaxWidth(_maxWidth);
  }, [canvasMaxWidth, canvasMaxWidthType]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedGetCanvasMaxWidth = useCallback(debounce(getCanvasMaxWidth, 250), [getCanvasMaxWidth]);

  useEffect(() => {
    window.addEventListener('resize', () => debouncedGetCanvasMaxWidth);
    getCanvasMaxWidth(); // Initial call without debounce

    return () => {
      window.removeEventListener('resize', debouncedGetCanvasMaxWidth);
      debouncedGetCanvasMaxWidth.cancel(); // Cancel any pending debounced calls
    };
  }, [debouncedGetCanvasMaxWidth, getCanvasMaxWidth]);

  return maxWidth;
};

export default useAppCanvasMaxWidth;
