import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';
import Tooltip from 'react-bootstrap/Tooltip';
import './rightSidebarToggle.scss';
import { Plus, PencilRuler, BookOpen } from 'lucide-react';
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
      className={`tw-flex tw-flex-col tw-p-2 tw-gap-1.5 right-sidebar-toggle right-sidebar tw-bg-background-surface-layer-01 ${
        darkMode ? 'dark-theme' : ''
      }`}
      data-cy="right-sidebar-inspector"
    >
      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS}
        onClick={() => {
          handleToggle(RIGHT_SIDE_BAR_TAB.COMPONENTS);
        }}
        darkMode={darkMode}
        icon="plus"
        iconOnly
        className={`left-sidebar-inspector`}
        tip="Components"
      >
        <Plus
          width="16"
          height="16"
          className={`${
            activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS ? 'tw-text-icon-accent' : 'tw-text-icon-strong'
          }`}
        />
      </SidebarItem>

      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION}
        onClick={() => {
          handleToggle(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }}
        darkMode={darkMode}
        icon="propertiesstyles"
        iconOnly
        iconWidth="14"
        tip="Component properties"
      >
        <PencilRuler
          width="16"
          height="16"
          className={`${
            activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION ? 'tw-text-icon-accent' : 'tw-text-icon-strong'
          }`}
        />
      </SidebarItem>
      {appType !== 'module' && (
        <SidebarItem
          selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES}
          onClick={() => {
            handleToggle(RIGHT_SIDE_BAR_TAB.PAGES);
          }}
          darkMode={darkMode}
          icon="file01"
          iconOnly
          tip="Page settings"
        >
          <BookOpen
            width="16"
            height="16"
            className={`${
              activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES ? 'tw-text-icon-accent' : 'tw-text-icon-strong'
            }`}
          />
        </SidebarItem>
      )}
    </div>
  );
};

export default RightSidebarToggle;
