import '@/_styles/left-sidebar.scss';
import React, { useState, useImperativeHandle, forwardRef } from 'react';

import { LeftSidebarInspector } from './SidebarInspector';
import { LeftSidebarDataSources } from './SidebarDatasources';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger';
import { LeftSidebarComment } from './SidebarComment';
import LeftSidebarPageSelector from './SidebarPageSelector';
import { ConfirmDialog } from '@/_components';
import config from 'config';

export const LeftSidebar = forwardRef((props, ref) => {
  const router = useRouter();
  const {
    appId,
    switchDarkMode,
    showComments,
    darkMode = false,
    components,
    toggleComments,
    dataSources = [],
    dataSourcesChanged,
    dataQueriesChanged,
    errorLogs,
    appVersionsId,
    debuggerActions,
    currentState,
    appDefinition,
    setSelectedComponent,
    removeComponent,
    runQuery,
    currentPageId,
    addNewPage,
    switchPage,
    deletePage,
    renamePage,
    hidePage,
    unHidePage,
    updateHomePage,
    updatePageHandle,
    showHideViewerNavigationControls,
    updateOnSortingPages,
    updateOnPageLoadEvents,
    apps,
    dataQueries,
    clonePage,
  } = props;
  const [selectedSidebarItem, setSelectedSidebarItem] = useState();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);

  useImperativeHandle(ref, () => ({
    dataSourceModalToggleStateHandler() {
      toggleDataSourceManagerModal(true);
    },
  }));

  const handleSelectedSidebarItem = (item) => {
    if (item === selectedSidebarItem) {
      setSelectedSidebarItem(null);
    } else {
      setSelectedSidebarItem(item);
    }
  };

  return (
    <div className="left-sidebar" data-cy="left-sidebar-inspector">
      <LeftSidebarPageSelector
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        setSelectedSidebarItem={handleSelectedSidebarItem}
        appDefinition={appDefinition}
        currentPageId={currentPageId}
        addNewPage={addNewPage}
        switchPage={switchPage}
        deletePage={deletePage}
        renamePage={renamePage}
        hidePage={hidePage}
        unHidePage={unHidePage}
        updateHomePage={updateHomePage}
        updatePageHandle={updatePageHandle}
        clonePage={clonePage}
        pages={Object.entries(appDefinition.pages).map(([id, page]) => ({ id, ...page })) || []}
        homePageId={appDefinition.homePageId}
        showHideViewerNavigationControls={showHideViewerNavigationControls}
        updateOnSortingPages={updateOnSortingPages}
        updateOnPageLoadEvents={updateOnPageLoadEvents}
        currentState={currentState}
        apps={apps}
        dataQueries={dataQueries}
      />
      <LeftSidebarInspector
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        setSelectedSidebarItem={handleSelectedSidebarItem}
        currentState={currentState}
        appDefinition={appDefinition}
        setSelectedComponent={setSelectedComponent}
        removeComponent={removeComponent}
        runQuery={runQuery}
        dataSources={dataSources}
      />
      <LeftSidebarDataSources
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        setSelectedSidebarItem={handleSelectedSidebarItem}
        appId={appId}
        editingVersionId={appVersionsId}
        dataSources={dataSources}
        dataSourcesChanged={dataSourcesChanged}
        dataQueriesChanged={dataQueriesChanged}
        toggleDataSourceManagerModal={toggleDataSourceManagerModal}
        showDataSourceManagerModal={showDataSourceManagerModal}
      />
      {config.COMMENT_FEATURE_ENABLE && (
        <LeftSidebarComment
          appVersionsId={appVersionsId}
          selectedSidebarItem={showComments ? 'comments' : ''}
          toggleComments={toggleComments}
          currentPageId={currentPageId}
        />
      )}
      <ConfirmDialog
        show={showLeaveDialog}
        message={'The unsaved changes will be lost if you leave the editor, do you want to leave?'}
        onConfirm={() => router.push('/')}
        onCancel={() => setShowLeaveDialog(false)}
      />
      <div className="left-sidebar-stack-bottom">
        <LeftSidebarDebugger
          darkMode={darkMode}
          selectedSidebarItem={selectedSidebarItem}
          setSelectedSidebarItem={handleSelectedSidebarItem}
          components={components}
          errors={errorLogs}
          debuggerActions={debuggerActions}
          currentPageId={currentPageId}
        />
        <div className="left-sidebar-item no-border">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
      </div>
    </div>
  );
});
