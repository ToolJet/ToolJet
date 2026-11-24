import React, { useEffect } from 'react';
//TODO: Inspector folder needs to be refactored
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { shallow } from 'zustand/shallow';
import AppHeaderStylesPanel from './AppHeaderStylesPanel';
import AppFooterStylesPanel from './AppFooterStylesPanel';

export const ComponentConfigurationTab = ({ darkMode, isModuleEditor }) => {
  // Render from the panel's own subject, not the live canvas selection: an empty-canvas click clears the selection and
  // closes the panel, and these properties stay on screen while it slides out.
  const subject = useStore((state) => state.rightPanelSubject, shallow);
  const subjectComponentId = subject?.type === 'component' ? subject.id : null;
  // The remembered component may have been deleted or belong to another page.
  const selectedComponentId = useStore(
    (state) => (subjectComponentId && state.getComponentDefinition(subjectComponentId) ? subjectComponentId : null),
    shallow
  );
  const activeTab = useStore((state) => state.activeRightSideBarTab, shallow);
  const isCanvasHeaderSelected = subject?.type === 'header';
  const isCanvasFooterSelected = subject?.type === 'footer';
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);

  const handleToggle = () => {
    setActiveRightSideBarTab(null);
    setRightSidebarOpen(false);
  };

  // The panel opens only for a component, header or footer. With none of them (the component was deleted, or is on
  // another page) it closes instead of showing an empty page.
  const isEmpty = !isCanvasHeaderSelected && !isCanvasFooterSelected && !selectedComponentId;
  useEffect(() => {
    if (isEmpty && activeTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION) setRightSidebarOpen(false);
  }, [isEmpty, activeTab, setRightSidebarOpen]);

  if (isCanvasHeaderSelected) {
    return <AppHeaderStylesPanel />;
  }
  if (isCanvasFooterSelected) {
    return <AppFooterStylesPanel />;
  }

  // Nothing to configure: there is no empty properties page, the panel closes (PR #19054).
  if (!selectedComponentId) return null;
  return (
    <FallbackBoundary
      label="Properties panel"
      location="Properties Panel"
      darkMode={darkMode}
      resetKeys={[selectedComponentId]}
    >
      <Inspector
        componentDefinitionChanged={() => {}}
        darkMode={darkMode}
        selectedComponentId={selectedComponentId}
        pages={[]}
        isModuleEditor={isModuleEditor}
        handleRightSidebarToggle={handleToggle}
      />
    </FallbackBoundary>
  );
};
