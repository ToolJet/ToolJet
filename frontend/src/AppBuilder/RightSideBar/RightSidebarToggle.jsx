import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';
import Tooltip from 'react-bootstrap/Tooltip';
import './rightSidebarToggle.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

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
      toggleRightSidebar(!isRightSidebarOpen);
    }
  };

  return (
    <div
      className={cx('right-sidebar-toggle cursor-pointer', { 'dark-theme': darkMode })}
      data-cy="right-sidebar-toggle"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        onClick={() => {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS);
          if (activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS) {
            handleToggle();
          }
        }}
      >
        <SolidIcon
          name={'plus'}
          fill={isRightSidebarOpen && activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS ? '#4368E3' : '#CCD1D5'}
        />
      </div>
      <div
        className="cursor-pointer"
        onClick={() => {
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
          if (activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION) {
            handleToggle();
          }
        }}
      >
        <SolidIcon
          name={'inspect'}
          fill={
            isRightSidebarOpen && activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION ? '#4368E3' : '#CCD1D5'
          }
        />
      </div>
    </div>
  );
};

export default RightSidebarToggle;
