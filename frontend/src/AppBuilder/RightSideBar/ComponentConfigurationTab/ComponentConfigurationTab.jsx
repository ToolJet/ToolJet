import React from 'react';
//TODO: Inspector folder needs to be refactored
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ComponentConfigurationTab = ({ darkMode, isModuleEditor }) => {
  const selectedComponentId = useStore((state) => state.selectedComponents?.[0], shallow);
  const activeTab = useStore((state) => state.activeRightSideBarTab, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);

  const handleToggle = () => {
    setActiveRightSideBarTab(null);
    setRightSidebarOpen(false);
  };
  if (!selectedComponentId && activeTab !== RIGHT_SIDE_BAR_TAB.PAGES) {
    // return setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS);
    return (
      <>
        <div className="empty-configuration-header">
          <div className="header">Component properties</div>
          <div className="icon-btn cursor-pointer flex-shrink-0 p-2 h-4 w-4" onClick={handleToggle}>
            <SolidIcon fill="var(--icon-strong)" name={'remove03'} width="16" viewBox="0 0 16 16" />
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-center no-component-selected">
          <SolidIcon name="cursorclick" width="28" />
          <div className="tj-text-sm font-weight-500 heading">No component selected</div>
          <div className="tj-text-xsm sub-heading">
            Click a component on the canvas to view and edit its properties.
          </div>
        </div>
      </>
    );
  }
  return (
    <Inspector
      componentDefinitionChanged={() => {}}
      darkMode={darkMode}
      selectedComponentId={selectedComponentId}
      pages={[]}
      isModuleEditor={isModuleEditor}
      handleRightSidebarToggle={handleToggle}
    />
  );
};
