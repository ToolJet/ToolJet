import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import {
  LEFT_SIDEBAR_WIDTH,
  RIGHT_SIDEBAR_WIDTH,
  PAGES_SIDEBAR_WIDTH_EXPANDED,
  PAGES_SIDEBAR_WIDTH_COLLAPSED,
} from './appCanvasConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export default function useCanvasMinWidth({ currentMode, position, isModuleMode, isViewerSidebarPinned }) {
  const { moduleId } = useModuleContext();
  const isSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);

  const getMinWidth = () => {
    if (isModuleMode) return '100%';

    const isLeftSidebarOpenInEditor = currentMode === 'edit' ? isSidebarOpen : false;

    const shouldAdjust = isSidebarOpen || (isRightSidebarOpen && currentMode === 'edit');

    if (!shouldAdjust) return '';
    let offset;
    const currentSideBarWidth = LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default;

    if (isViewerSidebarPinned && !isPagesSidebarHidden) {
      if (position === 'side' && isLeftSidebarOpenInEditor && isRightSidebarOpen && !isPagesSidebarHidden) {
        offset = `${currentSideBarWidth + RIGHT_SIDEBAR_WIDTH - PAGES_SIDEBAR_WIDTH_EXPANDED}px`;
      } else if (position === 'side' && isLeftSidebarOpenInEditor && !isRightSidebarOpen && !isPagesSidebarHidden) {
        offset = `${currentSideBarWidth - PAGES_SIDEBAR_WIDTH_EXPANDED}px`;
      } else if (position === 'side' && isRightSidebarOpen && !isLeftSidebarOpenInEditor && !isPagesSidebarHidden) {
        offset = `${RIGHT_SIDEBAR_WIDTH - PAGES_SIDEBAR_WIDTH_EXPANDED}px`;
      }
    } else {
      if (position === 'side' && isLeftSidebarOpenInEditor && isRightSidebarOpen && !isPagesSidebarHidden) {
        offset = `${currentSideBarWidth + RIGHT_SIDEBAR_WIDTH - PAGES_SIDEBAR_WIDTH_COLLAPSED}px`;
      } else if (position === 'side' && isLeftSidebarOpenInEditor && !isRightSidebarOpen && !isPagesSidebarHidden) {
        offset = `${currentSideBarWidth - PAGES_SIDEBAR_WIDTH_COLLAPSED}px`;
      } else if (position === 'side' && isRightSidebarOpen && !isLeftSidebarOpenInEditor && !isPagesSidebarHidden) {
        offset = `${RIGHT_SIDEBAR_WIDTH - PAGES_SIDEBAR_WIDTH_COLLAPSED}px`;
      }
    }

    if (currentMode === 'edit') {
      if ((position === 'top' || isPagesSidebarHidden) && isLeftSidebarOpenInEditor && isRightSidebarOpen) {
        offset = `${currentSideBarWidth + RIGHT_SIDEBAR_WIDTH}px`;
      } else if ((position === 'top' || isPagesSidebarHidden) && isLeftSidebarOpenInEditor && !isRightSidebarOpen) {
        offset = `${currentSideBarWidth}px`;
      } else if ((position === 'top' || isPagesSidebarHidden) && isRightSidebarOpen && !isLeftSidebarOpenInEditor) {
        offset = `${RIGHT_SIDEBAR_WIDTH}px`;
      }
    }
    return `calc(100% + ${offset})`;
  };
  return getMinWidth();
}
