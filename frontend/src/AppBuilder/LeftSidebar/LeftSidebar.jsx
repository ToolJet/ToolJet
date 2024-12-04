import React, { useState, useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { SidebarItem } from './SidebarItem';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { DarkModeToggle } from '@/_components';
import Popover from '@/_ui/Popover';
import { PageMenu } from './PageMenu';
import LeftSidebarInspector from './LeftSidebarInspector/LeftSidebarInspector';
import GlobalSettings from './GlobalSettings';
import '../../_styles/left-sidebar.scss';
import Debugger from './Debugger/Debugger';

// TODO: remove passing refs to LeftSidebarItem and use state
// TODO: need to add datasources to the sidebar.
// TODO: add dark/light mode toggle
// TODO: move popover and component selection to separate component
// TODO: create usable header component that can accept page specific buttton as props/children
export const LeftSidebar = ({ darkMode = false, switchDarkMode }) => {
  const [
    pinned,
    selectedSidebarItem,
    setPinned,
    setSelectedSidebarItem,
    currentMode,
    queryPanelHeight,
    unreadErrorCount,
    resetUnreadErrorCount,
    toggleLeftSidebar,
    isSidebarOpen,
  ] = useStore(
    (state) => [
      state.isLeftSideBarPinned,
      state.selectedSidebarItem,
      state.setIsLeftSideBarPinned,
      state.setSelectedSidebarItem,
      state.currentMode,
      state.queryPanel.queryPanelHeight,
      state.debugger.unreadErrorCount,
      state.debugger.resetUnreadErrorCount,
      state.toggleLeftSidebar,
      state.isSidebarOpen,
    ],
    shallow
  );

  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);
  const sideBarBtnRefs = useRef({});

  const handleSelectedSidebarItem = (item) => {
    pinned && localStorage.setItem('selectedSidebarItem', item);
    if (item === 'debugger') resetUnreadErrorCount();
    setSelectedSidebarItem(item);
    if (item === selectedSidebarItem && !pinned) {
      return toggleLeftSidebar(false);
    }
    if (!isSidebarOpen) toggleLeftSidebar(true);
  };

  const setSideBarBtnRefs = (page) => (ref) => {
    sideBarBtnRefs.current[page] = ref;
  };

  useEffect(() => {
    setPopoverContentHeight(
      ((window.innerHeight - (queryPanelHeight == 0 ? 40 : queryPanelHeight) - 45) / window.innerHeight) * 100
    ); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  const renderPopoverContent = () => {
    if (selectedSidebarItem === null || !isSidebarOpen) return null;
    switch (selectedSidebarItem) {
      case 'page':
        return (
          <PageMenu
            setPinned={setPinned}
            pinned={pinned}
            darkMode={darkMode}
            selectedSidebarItem={selectedSidebarItem}
          />
        );
      case 'inspect':
        return (
          <LeftSidebarInspector
            darkMode={darkMode}
            // selectedSidebarItem={selectedSidebarItem}
            // appDefinition={appDefinition}
            // setSelectedComponent={setSelectedComponent}
            // removeComponent={removeComponent}
            // runQuery={runQuery}
            // popoverContentHeight={popoverContentHeight}
            setPinned={setPinned}
            pinned={pinned}
          />
        );
      //   case 'datasource':
      //     return (
      //       <LeftSidebarDataSources
      //         darkMode={darkMode}
      //         appId={appId}
      //         dataSourcesChanged={dataSourcesChanged}
      //         globalDataSourcesChanged={globalDataSourcesChanged}
      //         dataQueriesChanged={dataQueriesChanged}
      //         toggleDataSourceManagerModal={toggleDataSourceManagerModal}
      //         showDataSourceManagerModal={showDataSourceManagerModal}
      //         onDeleteofAllDataSources={() => {
      //           handleSelectedSidebarItem(null);
      //           handlePin(false);
      //           delete sideBarBtnRefs.current['datasource'];
      //         }}
      //         setPinned={handlePin}
      //         pinned={pinned}
      //       />
      //     );
      case 'debugger':
        return <Debugger setPinned={setPinned} pinned={pinned} darkMode={darkMode} />;
      //     );
      //   case 'settings':
      //     return (
      //       <GlobalSettings
      //         globalSettingsChanged={globalSettingsChanged}
      //         globalSettings={appDefinition.globalSettings}
      //         darkMode={darkMode}
      //         toggleAppMaintenance={toggleAppMaintenance}
      //         isMaintenanceOn={isMaintenanceOn}
      //         app={app}
      //         backgroundFxQuery={backgroundFxQuery}
      //       />
      //     );
      case 'settings':
        return (
          <GlobalSettings
            // globalSettingsChanged={globalSettingsChanged}
            // globalSettings={appDefinition.globalSettings}
            darkMode={darkMode}
            // toggleAppMaintenance={toggleAppMaintenance}
            // isMaintenanceOn={isMaintenanceOn}
            // app={app}
            // backgroundFxQuery={backgroundFxQuery}
          />
        );
    }
  };

  // TODO: Move this logic to a wrapper component and show components based on the mode
  if (currentMode === 'view') {
    return null;
  }

  return (
    <div className={cx('left-sidebar', { 'dark-theme theme-dark': darkMode })} data-cy="left-sidebar-inspector">
      <SidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('page')}
        darkMode={darkMode}
        icon="page"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-page-selector`}
        tip="Pages"
        ref={setSideBarBtnRefs('page')}
      />

      <SidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('inspect')}
        darkMode={darkMode}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Inspector"
        ref={setSideBarBtnRefs('inspect')}
      />

      <SidebarItem
        icon="debugger"
        selectedSidebarItem={selectedSidebarItem}
        darkMode={darkMode}
        // eslint-disable-next-line no-unused-vars
        onClick={(e) => handleSelectedSidebarItem('debugger')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        count={unreadErrorCount}
        tip="Debugger"
        ref={setSideBarBtnRefs('debugger')}
      />
      <SidebarItem
        icon="settings"
        selectedSidebarItem={selectedSidebarItem}
        darkMode={darkMode}
        // eslint-disable-next-line no-unused-vars
        onClick={(e) => handleSelectedSidebarItem('settings')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        tip="Settings"
        ref={setSideBarBtnRefs('settings')}
      />

      {/* 	{dataSources?.length > 0 && (
				<LeftSidebarItem
					selectedSidebarItem={selectedSidebarItem}
					onClick={() => handleSelectedSidebarItem('datasource')}
					icon="datasource"
					className={`left-sidebar-item left-sidebar-layout sidebar-datasources`}
					tip="Sources"
					ref={setSideBarBtnRefs('datasource')}
				/>
			)} */}

      <Popover
        onInteractOutside={(e) => {
          const isWithinSidebar = e.target.closest('.left-sidebar');
          if (pinned || isWithinSidebar) return;
          toggleLeftSidebar(false);
        }}
        open={isSidebarOpen}
        popoverContentClassName={`p-0 sidebar-h-100-popover ${selectedSidebarItem}`}
        side="right"
        popoverContent={renderPopoverContent()}
        popoverContentHeight={popoverContentHeight}
      />
      <div className="left-sidebar-stack-bottom">
        <div className="">
          {/* <div style={{ maxHeight: '32px', maxWidth: '32px', marginBottom: '16px' }}>
            <LeftSidebarComment
              selectedSidebarItem={showComments ? 'comments' : ''}
              currentPageId={currentPageId}
              isVersionReleased={isVersionReleased}
              isEditorFreezed={isEditorFreezed}
              ref={setSideBarBtnRefs('comments')}
            />
          </div> */}
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
      </div>
    </div>
  );
};
