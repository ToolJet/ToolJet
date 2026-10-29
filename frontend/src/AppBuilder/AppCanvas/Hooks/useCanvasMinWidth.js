import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH, RIGHT_SIDEBAR_WIDTH } from '../appCanvasConstants';
import { getLeftPanelState } from '@/AppBuilder/panelLayout';

export default function useCanvasMinWidth({ currentMode, isModuleMode }) {
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isLeftPanelOpen = getLeftPanelState(selectedSidebarItem, isLeftSidebarOpen).isLeftPanelOpen;

  const getMinWidth = () => {
    if (isModuleMode) return '100%';

    const shouldAdjust = currentMode === 'edit' && (isLeftPanelOpen || isRightSidebarOpen);

    if (!shouldAdjust) return '';
    let offset;
    const currentSideBarWidth = LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default;

    if (isLeftPanelOpen && isRightSidebarOpen) {
      offset = `${currentSideBarWidth + RIGHT_SIDEBAR_WIDTH}px`;
    } else if (isLeftPanelOpen && !isRightSidebarOpen) {
      offset = `${currentSideBarWidth}px`;
    } else if (isRightSidebarOpen && !isLeftPanelOpen) {
      offset = `${RIGHT_SIDEBAR_WIDTH}px`;
    }

    return `calc(100% + ${offset})`;
  };
  return getMinWidth();
}
