import { useState, useEffect, useRef } from 'react';
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
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const mode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);

  const prevEditorMarginLeft = useRef(editorMarginLeft);

  useEffect(() => {
    if (mode !== 'view')
      setEditorMarginLeft(
        isLeftSidebarOpen ? LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default : 0
      );
    else setEditorMarginLeft(0);
  }, [isLeftSidebarOpen, mode, selectedSidebarItem]);

  useEffect(() => {
    const scrollLeft = editorMarginLeft;
    const isScrollLeftChanged = canvasContainerRef.current.scrollLeft !== scrollLeft;
    if (!isEmpty(canvasContainerRef?.current) && (canvasContainerRef.current.scrollLeft === 0 || isScrollLeftChanged)) {
      canvasContainerRef.current.scrollLeft = scrollLeft;
      prevEditorMarginLeft.current = scrollLeft;
    }
  }, [editorMarginLeft, canvasContainerRef, isLeftSidebarOpen, isRightSidebarOpen]);
  return editorMarginLeft;
};
export default useSidebarMargin;
