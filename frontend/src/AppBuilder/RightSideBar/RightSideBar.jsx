import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import { ComponentsManagerTab } from './ComponentsManagerTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';

export const RightSideBar = ({ darkMode, moveableRef }) => {
  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const pageSettingSelected = useStore((state) => state.pageSettingSelected);

  return (
    <div className="sub-section">
      <div className={cx('editor-sidebar', { 'dark-theme theme-dark': darkMode })}>
        <div className={cx({ 'dark-theme theme-dark': darkMode })} style={{ position: 'relative', height: '100%' }}>
          {pageSettingSelected && <PageSettings />}
          {activeTab === 'components' ? (
            <ComponentsManagerTab darkMode={darkMode} moveableRef={moveableRef} />
          ) : (
            <ComponentConfigurationTab darkMode={darkMode} />
          )}
        </div>
      </div>
    </div>
  );
};
