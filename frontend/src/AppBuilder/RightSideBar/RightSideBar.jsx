import React, { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import ComponentsManagerTab from './ComponentManagerTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const RightSideBar = ({ darkMode }) => {
  const { isModuleEditor } = useModuleContext();
  const queryPanelHeight = useStore((state) => state.queryPanel.queryPanelHeight);
  const isDraggingQueryPane = useStore((state) => state.queryPanel.isDraggingQueryPane);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);
  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);

  useEffect(() => {
    if (!isDraggingQueryPane) {
      setPopoverContentHeight(
        ((window.innerHeight - (queryPanelHeight == 0 ? 40 : queryPanelHeight) - 45) / window.innerHeight) * 100
      );
    } else {
      setPopoverContentHeight(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight, isDraggingQueryPane]);

  if (!isRightSidebarOpen) return null;

  return (
    <div className="sub-section">
      <div
        style={{ height: `${popoverContentHeight}vh`, overflow: 'auto' }}
        className={cx(
          'editor-sidebar',
          { 'dark-theme theme-dark': darkMode },
          { 'tw-pointer-events-none': shouldFreeze }
        )}
      >
        <div className={cx({ 'dark-theme theme-dark': darkMode })} style={{ position: 'relative', height: '100%' }}>
          {activeTab === 'pages' && <PageSettings />}
          {activeTab === 'components' && <ComponentsManagerTab darkMode={darkMode} isModuleEditor={isModuleEditor} />}
          {activeTab === 'configuration' && (
            <ComponentConfigurationTab darkMode={darkMode} isModuleEditor={isModuleEditor} />
          )}
        </div>
      </div>
    </div>
  );
};
