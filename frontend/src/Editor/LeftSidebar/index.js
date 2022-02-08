import '@/_styles/left-sidebar.scss';
import React, { useState } from 'react';

import { LeftSidebarItem } from './SidebarItem';
import { LeftSidebarInspector } from './SidebarInspector';
import { LeftSidebarDataSources } from './SidebarDatasources';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger';
import { LeftSidebarComment } from './SidebarComment';
import { LeftSidebarGlobalSettings } from './SidebarGlobalSettings';
import { ConfirmDialog } from '@/_components';
import config from 'config';

export const LeftSidebar = ({
  appId,
  switchDarkMode,
  darkMode = false,
  components,
  toggleComments,
  dataSources = [],
  dataSourcesChanged,
  errorLogs,
  appVersionsId,
  globalSettingsChanged,
  globalSettings,
  currentState,
}) => {
  const router = useRouter();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  return (
    <div className="left-sidebar">
      <LeftSidebarInspector darkMode={darkMode} currentState={currentState} />
      <LeftSidebarDataSources
        darkMode={darkMode}
        appId={appId}
        editingVersionId={appVersionsId}
        dataSources={dataSources}
        dataSourcesChanged={dataSourcesChanged}
      />
      <LeftSidebarDebugger darkMode={darkMode} components={components} errors={errorLogs} />
      {config.COMMENT_FEATURE_ENABLE && (
        <LeftSidebarComment appVersionsId={appVersionsId} toggleComments={toggleComments} />
      )}
      <LeftSidebarGlobalSettings globalSettingsChanged={globalSettingsChanged} globalSettings={globalSettings} />
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
        {/* <LeftSidebarZoom onZoomChanged={onZoomChanged} /> */}
        <div className="left-sidebar-item no-border">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
      </div>
    </div>
  );
};
