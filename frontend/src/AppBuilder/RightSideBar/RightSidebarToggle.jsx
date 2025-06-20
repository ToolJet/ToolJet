import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';
import Tooltip from 'react-bootstrap/Tooltip';
import './rightSidebarToggle.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { SidebarItem } from './SidebarItem';

const RightSidebarToggle = ({ darkMode = false }) => {
  const [isRightSidebarOpen, toggleRightSidebar] = useStore(
    (state) => [state.isRightSidebarOpen, state.toggleRightSidebar],
    shallow
  );
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const handleToggle = () => {
    if (!isRightSidebarPinned) {
      toggleRightSidebar();
    }
  };

  return (
    <div
      className={cx(' right-sidebar-toggle left-sidebar', { 'dark-theme theme-dark': darkMode })}
      data-cy="left-sidebar-inspector"
    >
      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS}
        onClick={() => {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS);
          if (activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS) {
            handleToggle();
          }
        }}
        darkMode={darkMode}
        icon="plus"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Components"
      />
      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION}
        onClick={() => {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
          if (activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION) {
            handleToggle();
          }
        }}
        darkMode={darkMode}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Component properties"
      />
      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES}
        onClick={() => {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGES);
          if (activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES) {
            handleToggle();
          }
        }}
        darkMode={darkMode}
        icon="file01"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Page settings"
      />
    </div>
  );
};

export default RightSidebarToggle;
