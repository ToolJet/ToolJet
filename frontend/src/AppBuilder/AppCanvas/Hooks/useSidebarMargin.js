import { useEffect, useLayoutEffect, useRef } from 'react';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH } from '../appCanvasConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { getLeftPanelState } from '@/AppBuilder/panelLayout';

const useSidebarMargin = (canvasContainerRef) => {
  const { moduleId } = useModuleContext();
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isLeftPanelOpen = getLeftPanelState(selectedSidebarItem, isLeftSidebarOpen).isLeftPanelOpen;
  const mode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  // The canvas reserves the open left panel's width as a left border. It's derived in render so the
  // border is on the canvas by the time the layout effect below scrolls it.
  const editorMarginLeft =
    mode !== 'view' && isLeftPanelOpen ? (LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default) : 0;
  const scrollLeftRef = useRef(0);
  const appliedLeftSidebarWidthRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (canvasContainerRef.current) {
        scrollLeftRef.current = canvasContainerRef.current.scrollLeft;
      }
    };

    const canvasContainer = canvasContainerRef.current;
    if (canvasContainer) {
      canvasContainer.addEventListener('scroll', handleScroll);

      return () => {
        canvasContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [canvasContainerRef]);

  // Scroll by the change in reserved width so the widgets stay put under the panel. A layout effect
  // runs before paint, so the border and the scroll reach the screen in the same frame — scrolling
  // first (after paint) showed the widgets jump left for a frame whenever a panel opened or closed.
  useLayoutEffect(() => {
    if (mode === 'view' || isEmpty(canvasContainerRef?.current)) {
      appliedLeftSidebarWidthRef.current = 0;
      return;
    }
    const delta = editorMarginLeft - appliedLeftSidebarWidthRef.current;
    appliedLeftSidebarWidthRef.current = editorMarginLeft;
    if (delta !== 0) {
      canvasContainerRef.current.scrollTo({ left: scrollLeftRef.current + delta, behavior: 'instant' });
    }
  }, [editorMarginLeft, mode, canvasContainerRef]);

  return editorMarginLeft;
};
export default useSidebarMargin;
