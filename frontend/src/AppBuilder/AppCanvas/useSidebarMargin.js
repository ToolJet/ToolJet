import { useState, useEffect } from 'react';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH } from './appCanvasConstants';

const useSidebarMargin = (canvasContainerRef) => {
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem, shallow);

  useEffect(() => {
    setEditorMarginLeft(selectedSidebarItem ? LEFT_SIDEBAR_WIDTH : 0);
  }, [selectedSidebarItem]);

  useEffect(() => {
    if (!isEmpty(canvasContainerRef?.current)) {
      canvasContainerRef.current.scrollLeft += editorMarginLeft;
    }
  }, [editorMarginLeft, canvasContainerRef]);

  return editorMarginLeft;
};

export default useSidebarMargin;
