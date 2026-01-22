import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH, RIGHT_SIDEBAR_WIDTH } from './appCanvasConstants';

export default function useCanvasMinWidth({ currentMode, isModuleMode }) {
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);

  const getMinWidth = () => {
    if (isModuleMode) return '100%';

    const shouldAdjust = currentMode === 'edit' && (isLeftSidebarOpen || isRightSidebarOpen);

    if (!shouldAdjust) return '';
    let offset;
    const currentSideBarWidth = LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default;

    if (isLeftSidebarOpen && isRightSidebarOpen) {
      offset = `${currentSideBarWidth + RIGHT_SIDEBAR_WIDTH}px`;
    } else if (isLeftSidebarOpen && !isRightSidebarOpen) {
      offset = `${currentSideBarWidth}px`;
    } else if (isRightSidebarOpen && !isLeftSidebarOpen) {
      offset = `${RIGHT_SIDEBAR_WIDTH}px`;
    }

    return `calc(100% + ${offset})`;
  };
  return getMinWidth();
}
