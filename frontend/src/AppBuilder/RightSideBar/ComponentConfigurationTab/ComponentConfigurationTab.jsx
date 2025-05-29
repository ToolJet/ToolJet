import React from 'react';
//TODO: Inspector folder needs to be refactored
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { shallow } from 'zustand/shallow';

export const ComponentConfigurationTab = ({ darkMode, isModuleEditor }) => {
  const selectedComponentId = useStore((state) => state.selectedComponents?.[0], shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  if (!selectedComponentId) {
    return setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS);
  }
  return (
    <Inspector
      componentDefinitionChanged={() => {}}
      darkMode={darkMode}
      selectedComponentId={selectedComponentId}
      pages={[]}
      isModuleEditor={isModuleEditor}
    />
  );
};
