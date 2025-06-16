import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import { ComponentsManagerTab } from './ComponentsManagerTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';

export const RightSideBar = ({ darkMode }) => {
  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);
  if (!isRightSidebarOpen) return null;

  return (
    <div className="sub-section">
      <div className={cx('editor-sidebar', { 'dark-theme theme-dark': darkMode })}>
        <div className={cx({ 'dark-theme theme-dark': darkMode })} style={{ position: 'relative', height: '100%' }}>
          {activeTab === 'pages' && <PageSettings />}
          {activeTab === 'components' ? (
            <ComponentsManagerTab darkMode={darkMode} />
          ) : (
            <ComponentConfigurationTab darkMode={darkMode} />
          )}
        </div>
      </div>
    </div>
  );
};
