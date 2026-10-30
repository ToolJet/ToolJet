import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { LEFT_SIDEBAR_WIDTH } from '../appCanvasConstants';
import { getCanvasMinWidth, getLeftPanelState, getRightPanelReservedWidth } from '@/AppBuilder/panelLayout';

export default function useCanvasMinWidth({ currentMode, isModuleMode }) {
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const queryPanelWidth = useStore((state) => state.queryPanel.queryPanelWidth);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isLeftPanelOpen = getLeftPanelState(selectedSidebarItem, isLeftSidebarOpen).isLeftPanelOpen;

  if (isModuleMode) return '100%';
  if (currentMode !== 'edit') return '';

  const leftWidth = isLeftPanelOpen ? (LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default) : 0;
  return getCanvasMinWidth(
    leftWidth,
    getRightPanelReservedWidth(isRightSidebarOpen, activeRightSideBarTab, queryPanelWidth)
  );
}
