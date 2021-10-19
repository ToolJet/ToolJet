import '@/_styles/left-sidebar.scss';

import React, { useState } from 'react';

import { LeftSidebarItem } from './sidebar-item';
import { LeftSidebarInspector } from './sidebar-inspector';
import { LeftSidebarDataSources } from './sidebar-datasources';
import { LeftSidebarZoom } from './sidebar-zoom';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger';
import { ConfirmDialog } from '@/_components';

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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
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
        onClick={() => setShowLeaveDialog(true)}
        tip="Back to home"
        icon="back"
        className="left-sidebar-item no-border"
      />
      <ConfirmDialog
        show={showLeaveDialog}
        message={'The unsaved changes will be lost if you leave the editor, do you want to leave?'}
        onConfirm={() => router.push('/')}
        onCancel={() => setShowLeaveDialog(false)}
      />
      <div className="left-sidebar-stack-bottom">
        <LeftSidebarZoom onZoomChanged={onZoomChanged} />
        <div className="left-sidebar-item no-border">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
        <div className='left-sidebar-item no-border'>
          <button 
            type="button" 
            className="btn btn-sm"
            onClick={() => {
              window.$chatwoot.toggle();
            }}
            // disabled={currentLayout === 'mobile'}
          >
            <img src="/assets/images/icons/editor/chat.svg" width="40" height="40" className="mx-2" />
          </button>
        </div>
      </div>
    </div>
  );
};
