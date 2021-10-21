import '@/_styles/left-sidebar.scss';

import React from 'react';

import { LeftSidebarItem } from './sidebar-item';
import { LeftSidebarInspector } from './sidebar-inspector';
import { LeftSidebarDataSources } from './sidebar-datasources';
import { LeftSidebarZoom } from './sidebar-zoom';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger';

export const LeftSidebar = ({
  appId,
  switchDarkMode,
  darkMode = false,
  globals,
  components,
  queries,
  onZoomChanged,
  dataSources = [],
  dataSourcesChanged,
  errorLogs,
}) => {
  const router = useRouter();
  return (
    <div className="left-sidebar">
      <LeftSidebarInspector darkMode={darkMode} globals={globals} components={components} queries={queries} />
      <LeftSidebarDataSources
        darkMode={darkMode}
        appId={appId}
        dataSources={dataSources}
        dataSourcesChanged={dataSourcesChanged}
      />
      <LeftSidebarDebugger darkMode={darkMode} components={components} errors={errorLogs} />
      <LeftSidebarItem
        onClick={() => router.push('/')}
        tip="Back to home"
        icon="back"
        className="left-sidebar-item no-border"
      />
      <div className="left-sidebar-stack-bottom">
        <LeftSidebarZoom onZoomChanged={onZoomChanged} />
        <div className="left-sidebar-item no-border">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
      </div>
    </div>
  );
};
