import { useState, useEffect } from 'react';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { RIGHT_SIDEBAR_WIDTH } from './appCanvasConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const useRightSidebarMargin = (canvasContainerRef) => {
  const { moduleId } = useModuleContext();
  const [editorMarginRight, setEditorMarginRight] = useState(0);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const mode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);

  useEffect(() => {
    if (mode !== 'view') setEditorMarginRight(isRightSidebarOpen ? RIGHT_SIDEBAR_WIDTH : 0);
    else setEditorMarginRight(0);
  }, [isRightSidebarOpen, mode]);

  useEffect(() => {
    if (!isEmpty(canvasContainerRef?.current)) {
      canvasContainerRef.current.scrollRight += editorMarginRight;
    }
  }, [editorMarginRight, canvasContainerRef]);

  return editorMarginRight;
};

export default useRightSidebarMargin;
