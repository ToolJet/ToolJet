import '@/_styles/left-sidebar.scss';
import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import _ from 'lodash';
import { LeftSidebarInspector } from './SidebarInspector';
import { LeftSidebarDataSources } from './SidebarDatasources';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger';
import { LeftSidebarComment } from './SidebarComment';
import LeftSidebarPageSelector from './SidebarPageSelector';
import { ConfirmDialog } from '@/_components';
import config from 'config';
import { LeftSidebarItem } from './SidebarItem';
import Popover from '@/_ui/Popover';
import { usePanelHeight } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useDataSources } from '@/_stores/dataSourcesStore';
import { shallow } from 'zustand/shallow';

export const LeftSidebar = forwardRef((props, ref) => {
  const router = useRouter();
  const {
    appId,
    switchDarkMode,
    showComments,
    darkMode = false,
    components,
    toggleComments,
    dataSourcesChanged,
    globalDataSourcesChanged,
    dataQueriesChanged,
    errorLogs: errors,
    debuggerActions,
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
    clonePage,
    setEditorMarginLeft,
  } = props;

  const dataSources = useDataSources();
  const prevSelectedSidebarItem = localStorage.getItem('selectedSidebarItem');
  const queryPanelHeight = usePanelHeight();
  const [selectedSidebarItem, setSelectedSidebarItem] = useState(
    dataSources?.length === 0 && prevSelectedSidebarItem === 'database' ? 'inspect' : prevSelectedSidebarItem
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
  const [pinned, setPinned] = useState(!!localStorage.getItem('selectedSidebarItem'));
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorHistory, setErrorHistory] = useState({ appLevel: [], pageLevel: [] });
  const [unReadErrorCount, setUnReadErrorCount] = useState({ read: 0, unread: 0 });

  const sideBarBtnRefs = useRef({});

  const open = !!selectedSidebarItem;

  const clearErrorLogs = () => {
    setUnReadErrorCount({ read: 0, unread: 0 });

    setErrorLogs([]);
    setErrorHistory({ appLevel: [], pageLevel: [] });
  };

  useEffect(() => {
    if (currentPageId) {
      const olderPageErrorFromHistory = errorHistory.pageLevel[currentPageId] ?? [];
      const olderAppErrorFromHistory = errorHistory.appLevel ?? [];
      setErrorLogs(() => [...olderPageErrorFromHistory, ...olderAppErrorFromHistory]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  useEffect(() => {
    const newError = _.flow([
      Object.entries,
      // eslint-disable-next-line no-unused-vars
      (arr) => arr.filter(([key, value]) => value.data?.status),
      Object.fromEntries,
    ])(errors);

    const newErrorLogs = debuggerActions.generateErrorLogs(newError);
    const newPageLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'page_level');
    const newAppLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'app_level');
    if (newErrorLogs) {
      setErrorLogs((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));

        return [...newAppLevelErrorLogs, ...newPageLevelErrorLogs, ...copy];
      });

      setErrorHistory((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));

        return {
          appLevel: [...newAppLevelErrorLogs, ...copy.appLevel],
          pageLevel: {
            [currentPageId]: [...newPageLevelErrorLogs, ...(copy.pageLevel[currentPageId] ?? [])],
          },
        };
      });
    }
    debuggerActions.flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ errors })]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-unused-vars
      setUnReadErrorCount((prev) => ({ read: errorLogs.length, unread: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const unReadErrors = errorLogs.length - unReadErrorCount.read;
    setUnReadErrorCount((prev) => {
      return { ...prev, unread: unReadErrors };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLogs.length]);

  useEffect(() => {
    setPopoverContentHeight(((window.innerHeight - queryPanelHeight - 45) / window.innerHeight) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  useEffect(() => {
    if (!selectedSidebarItem) {
      setEditorMarginLeft(0);
    } else {
      setEditorMarginLeft(350);
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
        updateHomePage={updateHomePage}
        updatePageHandle={updatePageHandle}
        clonePage={clonePage}
        pages={Object.entries(appDefinition.pages).map(([id, page]) => ({ id, ...page })) || []}
        homePageId={appDefinition.homePageId}
        showHideViewerNavigationControls={showHideViewerNavigationControls}
        updateOnSortingPages={updateOnSortingPages}
        updateOnPageLoadEvents={updateOnPageLoadEvents}
        apps={apps}
        popoverContentHeight={popoverContentHeight}
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
    database: (
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
          delete sideBarBtnRefs.current['database'];
        }}
        setPinned={handlePin}
        pinned={pinned}
      />
    ),
    debugger: (
      <LeftSidebarDebugger
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        components={components}
        errors={errorLogs}
        debuggerActions={debuggerActions}
        currentPageId={currentPageId}
        popoverContentHeight={popoverContentHeight}
        clearErrorLogs={clearErrorLogs}
        setPinned={handlePin}
        pinned={pinned}
        setEditorMarginLeft={setEditorMarginLeft}
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
      {dataSources?.length > 0 && (
        <LeftSidebarItem
          selectedSidebarItem={selectedSidebarItem}
          onClick={() => handleSelectedSidebarItem('database')}
          icon="database"
          className={`left-sidebar-item left-sidebar-layout sidebar-datasources`}
          tip="Sources"
          ref={setSideBarBtnRefs('database')}
        />
      )}
      <Popover
        onInteractOutside={handleInteractOutside}
        open={pinned || !!selectedSidebarItem}
        popoverContentClassName="p-0 sidebar-h-100-popover"
        side="right"
        popoverContent={SELECTED_ITEMS[selectedSidebarItem]}
        popoverContentHeight={popoverContentHeight}
      />

      {config.COMMENT_FEATURE_ENABLE && (
        <div className={`${isVersionReleased && 'disabled'}`}>
          <LeftSidebarComment
            selectedSidebarItem={showComments ? 'comments' : ''}
            toggleComments={toggleComments}
            currentPageId={currentPageId}
            ref={setSideBarBtnRefs('comments')}
          />
        </div>
      )}
      <ConfirmDialog
        show={showLeaveDialog}
        message={'The unsaved changes will be lost if you leave the editor, do you want to leave?'}
        onConfirm={() => router.push('/')}
        onCancel={() => setShowLeaveDialog(false)}
        darkMode={darkMode}
      />
      <div className="left-sidebar-stack-bottom">
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

        <div className="left-sidebar-item no-border">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
      </div>
    </div>
  );
});
