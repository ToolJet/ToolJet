import { useState, useEffect, useRef } from 'react';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH } from '../appCanvasConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { getLeftPanelState } from '@/AppBuilder/panelLayout';

const useSidebarMargin = (canvasContainerRef) => {
  const { moduleId } = useModuleContext();
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isLeftPanelOpen = getLeftPanelState(selectedSidebarItem, isLeftSidebarOpen).isLeftPanelOpen;
  const mode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
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

  useEffect(() => {
    if (mode !== 'view' && !isEmpty(canvasContainerRef?.current)) {
      const leftSidebarWidth = LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default;
      const delta = isLeftPanelOpen
        ? leftSidebarWidth - appliedLeftSidebarWidthRef.current
        : -appliedLeftSidebarWidthRef.current;

      const nextScrollLeft = scrollLeftRef.current + delta;
      canvasContainerRef.current.scrollTo({ left: nextScrollLeft, behavior: 'instant' });

      appliedLeftSidebarWidthRef.current = isLeftPanelOpen ? leftSidebarWidth : 0;
      setEditorMarginLeft(isLeftPanelOpen ? leftSidebarWidth : 0);
    } else {
      setEditorMarginLeft(0);
      appliedLeftSidebarWidthRef.current = 0;
    }
  }, [isLeftPanelOpen, mode, selectedSidebarItem, canvasContainerRef]);

  return editorMarginLeft;
};
export default useSidebarMargin;
