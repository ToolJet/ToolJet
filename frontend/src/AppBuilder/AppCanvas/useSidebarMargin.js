import { useState, useEffect } from 'react';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH } from './appCanvasConstants';

const useSidebarMargin = (canvasContainerRef) => {
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const mode = useStore((state) => state.currentMode, shallow);

  useEffect(() => {
    if (mode !== 'view') setEditorMarginLeft(isSidebarOpen ? LEFT_SIDEBAR_WIDTH : 0);
    else setEditorMarginLeft(0);
  }, [isSidebarOpen, mode]);

  useEffect(() => {
    if (!isEmpty(canvasContainerRef?.current)) {
      canvasContainerRef.current.scrollLeft += editorMarginLeft;
    }
  }, [editorMarginLeft, canvasContainerRef]);

  return editorMarginLeft;
};

export default useSidebarMargin;
