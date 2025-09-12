import React, { useState, useEffect, useRef, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { SidebarItem } from './SidebarItem';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { DarkModeToggle } from '@/_components';
import Popover from '@/_ui/Popover';
// import { PageMenu } from './PageMenu';
import LeftSidebarInspector from './LeftSidebarInspector/LeftSidebarInspector';
import GlobalSettings from './GlobalSettings';
import '../../_styles/left-sidebar.scss';
import Debugger from './Debugger/Debugger';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import UpdatePresenceMultiPlayer from '@/AppBuilder/Header/UpdatePresenceMultiPlayer';
import { SquareDashedMousePointer, Bug, Bolt, History } from 'lucide-react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import SupportButton from './SupportButton';
import AvatarGroup from '@/_ui/AvatarGroup';
// eslint-disable-next-line import/no-unresolved
import { useOthers, useSelf } from '@y-presence/react';
import { useAppDataActions, useAppInfo } from '@/_stores/appDataStore';
import AppHistoryIcon from './AppHistory/AppHistoryIcon';
import AppHistory from './AppHistory';

// TODO: remove passing refs to LeftSidebarItem and use state
// TODO: need to add datasources to the sidebar.
// TODO: add dark/light mode toggle
// TODO: move popover and component selection to separate component
// TODO: create usable header component that can accept page specific buttton as props/children
export const BaseLeftSidebar = ({
  darkMode = false,
  switchDarkMode,
  renderAISideBarTrigger = () => null,
  renderAIChat = () => null,
  isUserInZeroToOneFlow,
}) => {
  const { moduleId, isModuleEditor, appType } = useModuleContext();
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
    isDraggingQueryPane,
  ] = useStore(
    (state) => [
      state.isLeftSideBarPinned,
      state.selectedSidebarItem,
      state.setIsLeftSideBarPinned,
      state.setSelectedSidebarItem,
      state.modeStore.modules[moduleId].currentMode,
      state.queryPanel.queryPanelHeight,
      state.debugger.unreadErrorCount,
      state.debugger.resetUnreadErrorCount,
      state.toggleLeftSidebar,
      state.isSidebarOpen,
      state.queryPanel.isDraggingQueryPane,
    ],
    shallow
  );

  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);
  const sideBarBtnRefs = useRef({});
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';

  const handleSelectedSidebarItem = (item) => {
    if (item === 'debugger') resetUnreadErrorCount();
    setSelectedSidebarItem(item);
    localStorage.setItem('selectedSidebarItem', item);
    if (item === selectedSidebarItem && !pinned) {
      return toggleLeftSidebar(false);
    }
    if (!isSidebarOpen) toggleLeftSidebar(true);
  };

  const setSideBarBtnRefs = (page) => (ref) => {
    sideBarBtnRefs.current[page] = ref;
  };

  useEffect(() => {
    if (isUserInZeroToOneFlow) {
      setPopoverContentHeight(((window.innerHeight - 48) / window.innerHeight) * 100);
      return;
    }

    if (!isDraggingQueryPane) {
      setPopoverContentHeight(
        ((window.innerHeight - (queryPanelHeight == 0 ? 40 : queryPanelHeight) - 45) / window.innerHeight) * 100
      );
    } else {
      setPopoverContentHeight(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserInZeroToOneFlow, queryPanelHeight, isDraggingQueryPane]);

  const renderPopoverContent = () => {
    if (selectedSidebarItem === null || !isSidebarOpen) return null;
    switch (selectedSidebarItem) {
      // case 'page':
      //   return (
      //     <PageMenu
      //       setPinned={setPinned}
      //       pinned={pinned}
      //       darkMode={darkMode}
      //       selectedSidebarItem={selectedSidebarItem}
      //     />
      //   );
      case 'page': // this handles cases where user has page pinned in old layout before LTS 3.16 update
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
            moduleId={moduleId}
            appType={appType}
          />
        );
      case 'tooljetai':
        return renderAIChat({ darkMode, isUserInZeroToOneFlow });
      case 'apphistory':
        return <AppHistory darkMode={darkMode} />;
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
            isModuleEditor={isModuleEditor}
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

  // TODO: Move icons as slots
  const renderCommonItems = () => {
    return (
      <>
        <SidebarItem
          selectedSidebarItem={selectedSidebarItem}
          onClick={() => handleSelectedSidebarItem('inspect')}
          darkMode={darkMode}
          icon="inspect"
          className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
          tip="Inspector"
          ref={setSideBarBtnRefs('inspect')}
        >
          <SquareDashedMousePointer width="16" height="16" className="tw-text-icon-strong" />
        </SidebarItem>

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
        >
          <Bug width="16" height="16" className="tw-text-icon-strong" />
        </SidebarItem>
      </>
    );
  };

  const renderLeftSidebarItems = () => {
    if (isModuleEditor) {
      return renderCommonItems();
    }
    return (
      <>
        {renderAISideBarTrigger({
          selectedSidebarItem: selectedSidebarItem,
          onClick: () => handleSelectedSidebarItem('tooljetai'),
          darkMode: darkMode,
          icon: 'tooljetai',
          className: `left-sidebar-item left-sidebar-layout left-sidebar-page-selector`,
          tip: 'Build with AI',
          ref: setSideBarBtnRefs('tooljetai'),
          children: <SolidIcon width="16" height="16" name="tooljetai" className="tw-text-icon-strong" />,
        })}

        {!isUserInZeroToOneFlow && (
          <>
            {renderCommonItems()}
            <AppHistoryIcon
              darkMode={darkMode}
              selectedSidebarItem={selectedSidebarItem}
              handleSelectedSidebarItem={handleSelectedSidebarItem}
              setSideBarBtnRefs={setSideBarBtnRefs}
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
              isModuleEditor={isModuleEditor}
            >
              <Bolt width="16" height="16" className="tw-text-icon-strong" />
            </SidebarItem>
          </>
        )}
      </>
    );
  };

  return (
    <div
      className={cx('left-sidebar !tw-z-10 tw-gap-1.5', { 'dark-theme theme-dark': darkMode })}
      data-cy="left-sidebar-inspector"
      style={{ zIndex: 9999 }}
    >
      {renderLeftSidebarItems()}
      <Popover
        onInteractOutside={(e) => {
          // if tooljetai is open don't close
          if (selectedSidebarItem === 'tooljetai') return;
          const isWithinSidebar = e.target.closest('.left-sidebar');
          const isClickOnInspect = e.target.closest('.config-handle-inspect');
          if (pinned || isWithinSidebar || isClickOnInspect) return;
          toggleLeftSidebar(false);
        }}
        open={isSidebarOpen}
        popoverContentClassName={`p-0 left-sidebar-scrollbar sidebar-h-100-popover ${selectedSidebarItem}`}
        side="right"
        popoverContent={renderPopoverContent()}
        popoverContentHeight={popoverContentHeight}
      />
      <div className="left-sidebar-stack-bottom">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {/* <div style={{ maxHeight: '32px', maxWidth: '32px', marginBottom: '16px' }}>
            <LeftSidebarComment
              selectedSidebarItem={showComments ? 'comments' : ''}
              currentPageId={currentPageId}
              isVersionReleased={isVersionReleased}
              isEditorFreezed={isEditorFreezed}
              ref={setSideBarBtnRefs('comments')}
            />
          </div> */}
          {shouldEnableMultiplayer && <AvatarGroupWrapper darkMode={darkMode} maxDisplay={2} />}
          {shouldEnableMultiplayer && <UpdatePresenceMultiPlayer />}
          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
          <SupportButton />
        </div>
      </div>
    </div>
  );
};

const AvatarGroupWrapper = ({ darkMode, maxDisplay }) => {
  const self = useSelf();
  const others = useOthers();
  const othersOnSameVersionAndPage = others.filter(
    (other) =>
      other?.presence &&
      self?.presence &&
      other?.presence?.editingVersionId === self?.presence?.editingVersionId &&
      other?.presence?.editingPageId === self?.presence?.editingPageId
  );

  const getAvatarText = (presence) => presence.firstName?.charAt(0) + presence.lastName?.charAt(0);
  const getAvatarTitle = (presence) => `${presence.firstName} ${presence.lastName}`;

  const mergedAvatars = [self, ...othersOnSameVersionAndPage];

  const transformedAvatars = useMemo(() => {
    return mergedAvatars.map((other) => ({
      ...other.presence,
      text: getAvatarText(other.presence),
      title: getAvatarTitle(other.presence),
    }));
  }, [JSON.stringify(mergedAvatars)]);

  const { updateState } = useAppDataActions();
  const { areOthersOnSameVersionAndPage, currentVersionId } = useAppInfo();

  useEffect(() => {
    const areActiveUsersOnSameVersionAndPage = othersOnSameVersionAndPage.length > 0;
    const shouldUpdateState = areActiveUsersOnSameVersionAndPage !== areOthersOnSameVersionAndPage;

    if (shouldUpdateState) updateState({ areOthersOnSameVersionAndPage: areActiveUsersOnSameVersionAndPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ others, self, currentVersionId })]);

  return <AvatarGroup avatars={transformedAvatars} maxDisplay={maxDisplay} variant="multiplayer" darkMode={darkMode} />;
};

export const LeftSidebar = withEditionSpecificComponent(BaseLeftSidebar, 'AiBuilder');
