import React, { useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import ComponentsManagerTab from './ComponentManagerTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const RightSideBar = ({ darkMode }) => {
  const { isModuleEditor } = useModuleContext();
  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);

  const sidebarRef = useRef(null);

  useEffect(() => {
    const rigthSidebarMenu = document.querySelector('.right-sidebar-toggle');
    function handleClickOutside(event) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !rigthSidebarMenu.contains(event.target) &&
        !isRightSidebarPinned
      ) {
        setRightSidebarOpen(false);
        setActiveRightSideBarTab(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRightSidebarPinned, setActiveRightSideBarTab, setRightSidebarOpen]);

  if (!isRightSidebarOpen) return null;

  return (
    <div ref={sidebarRef} className="sub-section">
      <div className={cx('editor-sidebar', { 'dark-theme theme-dark': darkMode })}>
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
