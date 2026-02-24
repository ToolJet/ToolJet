import { useState, useEffect, useRef, use } from 'react';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH } from './appCanvasConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const useSidebarMargin = (canvasContainerRef) => {
  const { moduleId } = useModuleContext();
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
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
      const delta = isLeftSidebarOpen
        ? leftSidebarWidth - appliedLeftSidebarWidthRef.current
        : -appliedLeftSidebarWidthRef.current;

      const nextScrollLeft = scrollLeftRef.current + delta;
      canvasContainerRef.current.scrollTo({ left: nextScrollLeft, behavior: 'instant' });

      appliedLeftSidebarWidthRef.current = isLeftSidebarOpen ? leftSidebarWidth : 0;
      setEditorMarginLeft(isLeftSidebarOpen ? leftSidebarWidth : 0);
    } else {
      setEditorMarginLeft(0);
      appliedLeftSidebarWidthRef.current = 0;
    }
  }, [isLeftSidebarOpen, mode, selectedSidebarItem, canvasContainerRef]);

  return editorMarginLeft;
};
export default useSidebarMargin;
