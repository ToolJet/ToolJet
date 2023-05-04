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
    globalDataSources = [],
    dataSourcesChanged,
    globalDataSourcesChanged,
    dataQueriesChanged,
    errorLogs: errors,
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
    queryPanelHeight,
    setEditorMarginLeft,
  } = props;
  const [selectedSidebarItem, setSelectedSidebarItem] = useState(localStorage.getItem('selectedSidebarItem'));
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);
  const [pinned, setPinned] = useState(!!localStorage.getItem('selectedSidebarItem'));
  const [errorLogs, setErrorLogs] = React.useState([]);
  const [errorHistory, setErrorHistory] = React.useState({ appLevel: [], pageLevel: [] });
  const [unReadErrorCount, setUnReadErrorCount] = React.useState({ read: 0, unread: 0 });
  const elemRef = useRef();

  const open = !!selectedSidebarItem;

  console.log('selectedSidebarItem', selectedSidebarItem, open);

  const clearErrorLogs = () => {
    setUnReadErrorCount(() => {
      return { read: 0, unread: 0 };
    });

    setErrorLogs(() => []);
    setErrorHistory(() => ({ appLevel: [], pageLevel: [] }));
  };

  React.useEffect(() => {
    if (currentPageId) {
      const olderPageErrorFromHistory = errorHistory.pageLevel[currentPageId] ?? [];
      const olderAppErrorFromHistory = errorHistory.appLevel ?? [];
      setErrorLogs(() => [...olderPageErrorFromHistory, ...olderAppErrorFromHistory]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  React.useEffect(() => {
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

  React.useEffect(() => {
    const unReadErrors = open ? 0 : errorLogs.length - unReadErrorCount.read;
    setUnReadErrorCount((prev) => {
      if (open) {
        return { read: errorLogs.length, unread: 0 };
      }
      return { ...prev, unread: unReadErrors };
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLogs.length, open]);

  useEffect(() => {
    popoverContentHeight !== queryPanelHeight && setPopoverContentHeight(queryPanelHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  useEffect(() => {
    if (!selectedSidebarItem) {
      setEditorMarginLeft(0);
    } else {
      setEditorMarginLeft(350);
    }
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

  const SELECTED_ITEMS = {
    page: (
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
        popoverContentHeight={popoverContentHeight}
        setPinned={handlePin}
        pinned={pinned}
      />
    ),
    inspect: (
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
        popoverContentHeight={popoverContentHeight}
        setPinned={handlePin}
        pinned={pinned}
      />
    ),
    debugger: (
      <LeftSidebarDebugger
        darkMode={darkMode}
        selectedSidebarItem={selectedSidebarItem}
        setSelectedSidebarItem={handleSelectedSidebarItem}
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
      />
      <LeftSidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('inspect')}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Inspector"
      />
      <Popover
        handleToggle={(open) => {
          if (!open && !pinned) handleSelectedSidebarItem('');
        }}
        {...(pinned ? { open: true } : { open: !!selectedSidebarItem })}
        popoverContentClassName="p-0 sidebar-h-100-popover"
        side="right"
        ref={elemRef}
        popoverContent={SELECTED_ITEMS[selectedSidebarItem]}
        popoverContentHeight={popoverContentHeight}
      />

      {dataSources?.length > 0 && (
        <LeftSidebarDataSources
          darkMode={darkMode}
          selectedSidebarItem={selectedSidebarItem}
          setSelectedSidebarItem={handleSelectedSidebarItem}
          appId={appId}
          editingVersionId={appVersionsId}
          dataSources={dataSources}
          globalDataSources={globalDataSources}
          dataSourcesChanged={dataSourcesChanged}
          globalDataSourcesChanged={globalDataSourcesChanged}
          dataQueriesChanged={dataQueriesChanged}
          toggleDataSourceManagerModal={toggleDataSourceManagerModal}
          showDataSourceManagerModal={showDataSourceManagerModal}
          popoverContentHeight={popoverContentHeight}
        />
      )}
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
        darkMode={darkMode}
      />
      <div className="left-sidebar-stack-bottom">
        <LeftSidebarItem
          icon="debugger"
          selectedSidebarItem={selectedSidebarItem}
          onClick={() => handleSelectedSidebarItem('debugger')}
          className={`left-sidebar-item  left-sidebar-layout`}
          badge={true}
          count={unReadErrorCount.unread}
          tip="Debugger"
        />

        <div className="left-sidebar-item no-border">
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
        {/* <LeftSidebarItem icon='support' className='left-sidebar-item' /> */}
      </div>
    </div>
  );
});
