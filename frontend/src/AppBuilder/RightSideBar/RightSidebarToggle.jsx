import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';
import Tooltip from 'react-bootstrap/Tooltip';
import './rightSidebarToggle.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { SidebarItem } from './SidebarItem';

const RightSidebarToggle = ({ darkMode = false }) => {
  const [isRightSidebarOpen, setRightSidebarOpen] = useStore(
    (state) => [state.isRightSidebarOpen, state.setRightSidebarOpen],
    shallow
  );
  const { appType } = useModuleContext();
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const handleToggle = (item) => {
    setActiveRightSideBarTab(item);
    if (item === activeRightSideBarTab && !isRightSidebarPinned) {
      setActiveRightSideBarTab('');
      return setRightSidebarOpen(false);
    }
    if (!isRightSidebarOpen) setRightSidebarOpen(true);
  };

  return (
    <div
      className={cx(' right-sidebar-toggle left-sidebar', { 'dark-theme theme-dark': darkMode })}
      data-cy="left-sidebar-inspector"
    >
      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS}
        onClick={() => {
          handleToggle(RIGHT_SIDE_BAR_TAB.COMPONENTS);
        }}
        darkMode={darkMode}
        icon="plus"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector component-image-holder`}
        tip="Components"
      />
      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION}
        onClick={() => {
          handleToggle(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }}
        darkMode={darkMode}
        icon="propertiesstyles"
        iconWidth="14"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Component properties"
      />
      {appType !== 'module' && (
        <SidebarItem
          selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES}
          onClick={() => {
            handleToggle(RIGHT_SIDE_BAR_TAB.PAGES);
          }}
          darkMode={darkMode}
          icon="file01"
          className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
          tip="Page settings"
        />
      )}
    </div>
  );
};

export default RightSidebarToggle;
