import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DEFAULT_CANVAS_WIDTH } from '../appCanvasConstants';

// CSS max-width of the canvas row (page sidebar + canvas), from the app's canvas settings. It depends
// on those settings only, so it is derived during render: no window listener, and no first render with
// a 0 max width that collapses the canvas.
const useAppCanvasMaxWidth = () => {
  const canvasMaxWidth = useStore((state) => state.globalSettings.canvasMaxWidth, shallow);
  const canvasMaxWidthType = useStore((state) => state.globalSettings.canvasMaxWidthType, shallow);

  if (canvasMaxWidthType === 'px') return `${canvasMaxWidth || DEFAULT_CANVAS_WIDTH}px`;
  if (canvasMaxWidthType === '%') return `${canvasMaxWidth}%`;
  return undefined;
};

export default useAppCanvasMaxWidth;
