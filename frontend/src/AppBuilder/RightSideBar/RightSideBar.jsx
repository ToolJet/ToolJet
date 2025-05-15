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
    <div className="sub-section" style={{ position: 'fixed', right: '-300px', top: 0, width: '300px', height: '100%' }}>
      <div className={cx('editor-sidebar h-100', { 'dark-theme theme-dark': darkMode })}>
        <div className={cx({ 'dark-theme theme-dark': darkMode })} style={{ height: '100%' }}>
          {pageSettingSelected && <PageSettings />}

          <div
            style={{
              // visibility: activeTab === 'components' ? 'visible' : 'hidden',
              height: '100%',
              display: activeTab === 'components' ? 'block' : 'none',
            }}
          >
            <ComponentsManagerTab darkMode={darkMode} moveableRef={moveableRef} />
          </div>
          <div
            style={{
              // visibility: activeTab !== 'components' ? 'visible' : 'hidden',
              display: activeTab !== 'components' ? 'block' : 'none',
            }}
          >
            <ComponentConfigurationTab darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
};
