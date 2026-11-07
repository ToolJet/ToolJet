import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import ComponentsManagerTab from './ComponentManagerTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from './rightSidebarConstants';
import { useCodeMode, useCodeModePin, CodeInspectorSidebar } from '@/AppBuilder/_helpers/codeModeHooks';

export const RightSideBar = ({ darkMode }) => {
  const { isModuleEditor } = useModuleContext();
  const shouldFreeze = useStore((state) => state.getShouldFreeze(false, isModuleEditor));
  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);
  const pinned = useCodeModePin();
  const codeMode = useCodeMode();

  if (!isRightSidebarOpen) return null;

  return (
    <div className="sub-section">
      <div
        style={{ overflow: 'auto' }}
        className={cx(
          'editor-sidebar',
          { 'dark-theme theme-dark': darkMode },
          { 'tw-pointer-events-none': shouldFreeze && !codeMode }
        )}
      >
        <div className={cx({ 'dark-theme theme-dark': darkMode })} style={{ position: 'relative', height: '100%' }}>
          {/* Catch-all for anything the tab-level boundaries don't cover. */}
          <FallbackBoundary label="Right sidebar" location="Right SideBar" darkMode={darkMode} resetKeys={[activeTab]}>
            {activeTab === RIGHT_SIDE_BAR_TAB.PAGES && !codeMode && (
              <FallbackBoundary label="Page settings" location="Page Settings" darkMode={darkMode}>
                <PageSettings />
              </FallbackBoundary>
            )}
            {activeTab === RIGHT_SIDE_BAR_TAB.COMPONENTS && !codeMode && (
              <FallbackBoundary
                label="Components manager"
                location="Right SideBar Components manager"
                darkMode={darkMode}
              >
                <ComponentsManagerTab darkMode={darkMode} isModuleEditor={isModuleEditor} />
              </FallbackBoundary>
            )}
            {pinned ? (
              <FallbackBoundary label="Style inspector" location="Style inspector" darkMode={darkMode}>
                <CodeInspectorSidebar darkMode={darkMode} />
              </FallbackBoundary>
            ) : (
              activeTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION && (
                <ComponentConfigurationTab darkMode={darkMode} isModuleEditor={isModuleEditor} />
              )
            )}
          </FallbackBoundary>
        </div>
      </div>
    </div>
  );
};
