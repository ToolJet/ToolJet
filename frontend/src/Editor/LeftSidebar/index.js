import '@/_styles/left-sidebar.scss';
import React, { useState, useImperativeHandle, forwardRef } from 'react';

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

export const LeftSidebar = forwardRef((props, ref) => {
  const router = useRouter();
  const {
    appId,
    switchDarkMode,
    darkMode = false,
    components,
    toggleComments,
    dataSources = [],
    dataSourcesChanged,
    dataQueriesChanged,
    errorLogs,
    appVersionsId,
    globalSettingsChanged,
    globalSettings,
    currentState,
    appDefinition,
    setSelectedComponent,
    removeComponent,
    runQuery,
    toggleAppMaintenance,
    is_maintenance_on,
    isSaving,
    isUnsavedQueriesAvailable,
  } = props;
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);

  useImperativeHandle(ref, () => ({
    dataSourceModalToggleStateHandler() {
      toggleDataSourceManagerModal(true);
    },
  }));
  return (
    <div className="left-sidebar">
      <LeftSidebarInspector
        darkMode={darkMode}
        currentState={currentState}
        appDefinition={appDefinition}
        setSelectedComponent={setSelectedComponent}
        removeComponent={removeComponent}
        runQuery={runQuery}
      />
      <LeftSidebarDataSources
        darkMode={darkMode}
        appId={appId}
        editingVersionId={appVersionsId}
        dataSources={dataSources}
        dataSourcesChanged={dataSourcesChanged}
        dataQueriesChanged={dataQueriesChanged}
        toggleDataSourceManagerModal={toggleDataSourceManagerModal}
        showDataSourceManagerModal={showDataSourceManagerModal}
      />
      <LeftSidebarDebugger darkMode={darkMode} components={components} errors={errorLogs} />
      {config.COMMENT_FEATURE_ENABLE && (
        <LeftSidebarComment appVersionsId={appVersionsId} toggleComments={toggleComments} />
      )}
      <LeftSidebarGlobalSettings
        currentState={currentState}
        globalSettingsChanged={globalSettingsChanged}
        globalSettings={globalSettings}
        darkMode={darkMode}
        toggleAppMaintenance={toggleAppMaintenance}
        is_maintenance_on={is_maintenance_on}
      />
      <LeftSidebarItem
        onClick={() => {
          if (isSaving || isUnsavedQueriesAvailable) {
            setShowLeaveDialog(true);
          } else {
            router.push('/');
          }
        }}
        tip="Back to home"
        icon="back"
        className="left-sidebar-item no-border left-sidebar-layout"
        text={'Back'}
        data-cy="back-button"
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
});
