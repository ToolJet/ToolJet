import '@/_styles/left-sidebar.scss';
import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import _ from 'lodash';
import { LeftSidebarInspector } from './SidebarInspector';
import { LeftSidebarDataSources } from './SidebarDatasources';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger/SidebarDebugger';
import { LeftSidebarComment } from './SidebarComment';
import LeftSidebarPageSelector from './SidebarPageSelector';
import { ConfirmDialog } from '@/_components';
import config from 'config';
import { LeftSidebarItem } from './SidebarItem';
import Popover from '@/_ui/Popover';
import { usePanelHeight } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { useDataSources } from '@/_stores/dataSourcesStore';
import { shallow } from 'zustand/shallow';
import useDebugger from './SidebarDebugger/useDebugger';
import { GlobalSettings } from '../Header/GlobalSettings';

export const LeftSidebar = forwardRef((props, ref) => {
  const router = useRouter();
  const {
    appId,
    switchDarkMode,
    darkMode = false,
    dataSourcesChanged,
    globalDataSourcesChanged,
    dataQueriesChanged,
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

    apps,
    clonePage,
    setEditorMarginLeft,
    globalSettingsChanged,
    toggleAppMaintenance,
    app,
    disableEnablePage,
    isMaintenanceOn,
  } = props;

  const dataSources = useDataSources();
  const prevSelectedSidebarItem = localStorage.getItem('selectedSidebarItem');
  const queryPanelHeight = usePanelHeight();
  const [selectedSidebarItem, setSelectedSidebarItem] = useState(
    dataSources?.length === 0 && prevSelectedSidebarItem === 'datasource' ? 'inspect' : prevSelectedSidebarItem
  );
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  const { showComments } = useEditorStore(
    (state) => ({
      showComments: state?.showComments,
    }),
    shallow
  );
  const [pinned, setPinned] = useState(!!localStorage.getItem('selectedSidebarItem'));

  const { errorLogs, clearErrorLogs, unReadErrorCount, allLog } = useDebugger({
    currentPageId,
    isDebuggerOpen: !!selectedSidebarItem,
  });

  const sideBarBtnRefs = useRef({});

  useEffect(() => {
    setPopoverContentHeight(((window.innerHeight - queryPanelHeight - 45) / window.innerHeight) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  useEffect(() => {
    if (!selectedSidebarItem) {
      setEditorMarginLeft(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSidebarItem]);

  useImperativeHandle(ref, () => ({
    dataSourceModalToggleStateHandler() {
      toggleDataSourceManagerModal(true);
    },
  }));

  const handleSelectedSidebarItem = (item) => {
    if (item === selectedSidebarItem && !pinned) {
      setSelectedSidebarItem(null);
    } else {
      setSelectedSidebarItem(item);
      pinned && localStorage.setItem('selectedSidebarItem', item);
    }
  };

  const handlePin = (isPin) => {
    isPin
      ? localStorage.setItem('selectedSidebarItem', selectedSidebarItem)
      : localStorage.removeItem('selectedSidebarItem');

    setPinned(isPin);
  };

  const handleInteractOutside = (ev) => {
    const isBtnClicked = Object.values(sideBarBtnRefs.current).some((btnRef) => {
      return btnRef.contains(ev.target);
    });

    if (!isBtnClicked && !pinned) {
      setSelectedSidebarItem(null);
    }
  };

  const setSideBarBtnRefs = (page) => (ref) => {
    sideBarBtnRefs.current[page] = ref;
  };

  const SELECTED_ITEMS = {
    page: (
      <LeftSidebarPageSelector
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        appDefinition={appDefinition}
        currentPageId={currentPageId}
        addNewPage={addNewPage}
        switchPage={switchPage}
        deletePage={deletePage}
        renamePage={renamePage}
        hidePage={hidePage}
        unHidePage={unHidePage}
        disableEnablePage={disableEnablePage}
        updateHomePage={updateHomePage}
        updatePageHandle={updatePageHandle}
        clonePage={clonePage}
        pages={
          Object.entries(_.cloneDeep(appDefinition).pages)
            .map(([id, page]) => ({ id, ...page }))
            .sort((a, b) => a.index - b.index) || []
        }
        homePageId={appDefinition.homePageId}
        showHideViewerNavigationControls={showHideViewerNavigationControls}
        updateOnSortingPages={updateOnSortingPages}
        apps={apps}
        setPinned={handlePin}
        pinned={pinned}
      />
    ),
    inspect: (
      <LeftSidebarInspector
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        appDefinition={appDefinition}
        setSelectedComponent={setSelectedComponent}
        removeComponent={removeComponent}
        runQuery={runQuery}
        popoverContentHeight={popoverContentHeight}
        setPinned={handlePin}
        pinned={pinned}
      />
    ),
    datasource: (
      <LeftSidebarDataSources
        darkMode={darkMode}
        appId={appId}
        dataSourcesChanged={dataSourcesChanged}
        globalDataSourcesChanged={globalDataSourcesChanged}
        dataQueriesChanged={dataQueriesChanged}
        toggleDataSourceManagerModal={toggleDataSourceManagerModal}
        showDataSourceManagerModal={showDataSourceManagerModal}
        onDeleteofAllDataSources={() => {
          handleSelectedSidebarItem(null);
          handlePin(false);
          delete sideBarBtnRefs.current['datasource'];
        }}
        setPinned={handlePin}
        pinned={pinned}
      />
    ),
    debugger: (
      <LeftSidebarDebugger
        darkMode={darkMode}
        errors={errorLogs}
        clearErrorLogs={clearErrorLogs}
        setPinned={handlePin}
        pinned={pinned}
        allLog={allLog}
      />
    ),
    settings: (
      <GlobalSettings
        globalSettingsChanged={globalSettingsChanged}
        globalSettings={appDefinition.globalSettings}
        darkMode={darkMode}
        toggleAppMaintenance={toggleAppMaintenance}
        isMaintenanceOn={isMaintenanceOn}
        app={app}
      />
    ),
  };

  return (
    <div className="left-sidebar" data-cy="left-sidebar-inspector">
      <LeftSidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('page')}
        icon="page"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-page-selector`}
        tip="Pages"
        ref={setSideBarBtnRefs('page')}
      />

      <LeftSidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('inspect')}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Inspector"
        ref={setSideBarBtnRefs('inspect')}
      />

      <LeftSidebarItem
        icon="debugger"
        selectedSidebarItem={selectedSidebarItem}
        // eslint-disable-next-line no-unused-vars
        onClick={(e) => handleSelectedSidebarItem('debugger')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        count={unReadErrorCount.unread}
        tip="Debugger"
        ref={setSideBarBtnRefs('debugger')}
      />
      <LeftSidebarItem
        icon="settings"
        selectedSidebarItem={selectedSidebarItem}
        // eslint-disable-next-line no-unused-vars
        onClick={(e) => handleSelectedSidebarItem('settings')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        tip="Settings"
        ref={setSideBarBtnRefs('settings')}
      />

      {dataSources?.length > 0 && (
        <LeftSidebarItem
          selectedSidebarItem={selectedSidebarItem}
          onClick={() => handleSelectedSidebarItem('datasource')}
          icon="datasource"
          className={`left-sidebar-item left-sidebar-layout sidebar-datasources`}
          tip="Sources"
          ref={setSideBarBtnRefs('datasource')}
        />
      )}

      <Popover
        onInteractOutside={handleInteractOutside}
        open={pinned || !!selectedSidebarItem}
        popoverContentClassName={`p-0 sidebar-h-100-popover ${selectedSidebarItem}`}
        side="right"
        popoverContent={SELECTED_ITEMS[selectedSidebarItem]}
        popoverContentHeight={popoverContentHeight}
      />
      <ConfirmDialog
        show={showLeaveDialog}
        message={'The unsaved changes will be lost if you leave the editor, do you want to leave?'}
        onConfirm={() => router.push('/')}
        onCancel={() => setShowLeaveDialog(false)}
        darkMode={darkMode}
      />
      <div className="left-sidebar-stack-bottom">
        <div className="">
          {config.COMMENT_FEATURE_ENABLE && (
            <div
              className={`${isVersionReleased && 'disabled'}`}
              style={{ maxHeight: '32px', maxWidth: '32px', marginBottom: '16px' }}
            >
              <LeftSidebarComment
                selectedSidebarItem={showComments ? 'comments' : ''}
                currentPageId={currentPageId}
                ref={setSideBarBtnRefs('comments')}
              />
            </div>
          )}
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
      </div>
    </div>
  );
});
