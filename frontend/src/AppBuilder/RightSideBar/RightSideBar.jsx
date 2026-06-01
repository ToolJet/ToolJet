import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import ComponentsManagerTab from './ComponentManagerTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import CrashTest from '@/_ui/ErrorBoundary/__CrashTest'; // TEMP: remove before commit
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from './rightSidebarConstants';

export const RightSideBar = ({ darkMode }) => {
  const { isModuleEditor } = useModuleContext();
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);

  if (!isRightSidebarOpen) return null;

  return (
    <div className="sub-section">
      <div
        style={{ overflow: 'auto' }}
        className={cx(
          'editor-sidebar',
          { 'dark-theme theme-dark': darkMode },
          { 'tw-pointer-events-none': shouldFreeze }
        )}
      >
        <div className={cx({ 'dark-theme theme-dark': darkMode })} style={{ position: 'relative', height: '100%' }}>
          {activeTab === RIGHT_SIDE_BAR_TAB.PAGES && (
            <FallbackBoundary label="Page settings" darkMode={darkMode}>
              <CrashTest message="☠️ Deliberate test crash in Page settings" />
              <PageSettings />
            </FallbackBoundary>
          )}
          {activeTab === RIGHT_SIDE_BAR_TAB.COMPONENTS && (
            <ComponentsManagerTab darkMode={darkMode} isModuleEditor={isModuleEditor} />
          )}
          {activeTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION && (
            <ComponentConfigurationTab darkMode={darkMode} isModuleEditor={isModuleEditor} />
          )}
        </div>
      </div>
    </div>
  );
};
