import React, { useState, useEffect, useRef, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { SidebarItem } from './SidebarItem';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { DarkModeToggle } from '@/_components';
import Popover from '@/_ui/Popover';
// import { PageMenu } from './PageMenu';
import GlobalSettings from './GlobalSettings';
import DependencyViewer from './Dependencies/DependencyViewer';
import VariablesPanel from './Variables/VariablesPanel';
import '../../_styles/left-sidebar.scss';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import UpdatePresenceMultiPlayer from '@/AppBuilder/Header/UpdatePresenceMultiPlayer';
import {
  Blocks,
  DatabaseZap,
  Files,
  History,
  LockKeyhole,
  Network,
  ScanSearch,
  Search,
  Settings,
  Variable,
} from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { EditorView } from '@codemirror/view';
import CodeSearch from './CodeSearch/CodeSearch';
import Beta from '@/_ui/Beta';
import SupportButton from './SupportButton';
import AvatarGroup from '@/_ui/AvatarGroup';
import { onePerPerson } from './presenceAvatars';
// eslint-disable-next-line import/no-unresolved
import { useOthers, useSelf } from '@y-presence/react';
import { useAppDataActions, useAppInfo } from '@/_stores/appDataStore';
import { PageSettings } from '@/AppBuilder/RightSideBar/PageSettingsTab';
import ComponentsManagerTab from '@/AppBuilder/RightSideBar/ComponentManagerTab';
import { QueryDataPane } from '@/AppBuilder/QueryPanel/QueryDataPane';
import {
  getLeftPanelHeight,
  getLeftPanelOverflow,
  getLeftPanelState,
  PANEL_MOTION,
  shouldShowLibraries,
  SIDEBAR_ITEMS,
} from '@/AppBuilder/panelLayout';
import AppHistoryIcon from './AppHistory/AppHistoryIcon';
import AppHistory from './AppHistory';
import AppLibrariesIcon from './AppLibraries/AppLibrariesIcon';
import AppLibraries from './AppLibraries';
import { SecurityPanel, AccessPanel, CodeHistoryPanel, useCodeMode } from '@/AppBuilder/_helpers/codeModeHooks';
import { railClick } from './railClick';
import { useIsAiBlockedOnDefaultBranch } from '@/_hooks/useIsAiBlockedOnDefaultBranch';
import LegalReasonsErrorModal from '@/_components/LegalReasonsErrorModal';
import { fetchEdition } from '@/modules/common/helpers/utils';

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
}) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const codeMode = useCodeMode(moduleId);
  const isAiBlockedByBranch = useIsAiBlockedOnDefaultBranch();
  const buildMode = useStore((state) => state.appStore?.modules?.[moduleId]?.app?.buildMode);
  const [
    pinned,
    selectedSidebarItem,
    setSelectedSidebarItem,
    currentMode,
    queryPanelHeight,
    toggleLeftSidebar,
    isSidebarOpen,
    isDraggingQueryPane,
    isQueryPaneExpanded,
  ] = useStore(
    (state) => [
      state.isLeftSideBarPinned,
      state.selectedSidebarItem,
      state.setSelectedSidebarItem,
      state.modeStore.modules[moduleId].currentMode,
      state.queryPanel.queryPanelHeight,
      state.toggleLeftSidebar,
      state.isSidebarOpen,
      state.queryPanel.isDraggingQueryPane,
      state.queryPanel.isQueryPaneExpanded,
    ],
    shallow
  );

  useEffect(() => {
    if (isAiBlockedByBranch && selectedSidebarItem === 'tooljetai' && isSidebarOpen) {
      toggleLeftSidebar(false);
    }
  }, [isAiBlockedByBranch, selectedSidebarItem, isSidebarOpen, toggleLeftSidebar]);

  const [popoverContentHeight, setPopoverContentHeight] = useState(
    getLeftPanelHeight(isQueryPaneExpanded, queryPanelHeight)
  );
  const [isPanelContentMounted, setIsPanelContentMounted] = useState(isSidebarOpen);
  const [animatePanelSwitch, setAnimatePanelSwitch] = useState(false);
  const sideBarBtnRefs = useRef({});
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const [showAccessUpgrade, setShowAccessUpgrade] = useState(false);
  const accessInPlan = !!(featureAccess?.appPermissionPages || featureAccess?.appPermissionQuery);
  const returnToSearch = useStore((state) => state.codeSearch.returnToSearch);
  const setCodeSearchReturnToSearch = useStore((state) => state.setCodeSearchReturnToSearch);
  const multiPlayerEditEnabled = featureAccess?.multiPlayerEdit ?? false;
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true' && multiPlayerEditEnabled;
  // Closing clears selectedSidebarItem at once, but the panel keeps showing what it showed until its
  // exit animation ends (isPanelContentMounted drops PANEL_MOTION.durationMs after it closes).
  const lastPanelItemRef = useRef(selectedSidebarItem);
  if (selectedSidebarItem) lastPanelItemRef.current = selectedSidebarItem;
  const panelItem = selectedSidebarItem ?? (isPanelContentMounted ? lastPanelItemRef.current : null);
  const { isLeftPanelOpen, shouldMountLeftPanel } = getLeftPanelState(panelItem, isSidebarOpen);

  // Whether the open panel was opened over the chat, so its icon closes it back to the chat.
  const overChat = useRef(false);
  useEffect(() => {
    if (!isSidebarOpen) overChat.current = false;
  }, [isSidebarOpen]);

  const handleSelectedSidebarItem = (item) => {
    if (isAiBlockedByBranch && item === 'tooljetai') return;
    // Only a search result opens Settings with a way back to the search panel.
    setCodeSearchReturnToSearch(false);
    const click = railClick({
      item,
      selected: selectedSidebarItem,
      open: isSidebarOpen,
      pinned,
      codeMode,
      overChat: overChat.current,
    });
    overChat.current = click.overChat;
    if (!isAiBlockedByBranch && click.show === 'tooljetai' && item !== 'tooljetai') {
      setSelectedSidebarItem('tooljetai');
      localStorage.setItem('selectedSidebarItem', 'tooljetai');
      return;
    }
    // Left-rail clicks never close the right panel; it closes only from its own ×.
    setAnimatePanelSwitch(!isSidebarOpen || item !== selectedSidebarItem);
    setSelectedSidebarItem(item);
    localStorage.setItem('selectedSidebarItem', item);
    // Only treat a repeat click as "close" when the panel is actually OPEN. Panels that close
    // themselves (the AI chat's X, and every other onClose handler) call toggleLeftSidebar(false)
    // without clearing selectedSidebarItem, so it still points at that panel. Without the
    // isSidebarOpen check the next click matches this branch and closes an already-closed sidebar,
    // making the nav button look permanently disabled — the AI chat could not be reopened at all
    // once dismissed mid-generation.
    if (item === selectedSidebarItem && isSidebarOpen && !pinned) {
      return toggleLeftSidebar(false);
    }
    if (!isSidebarOpen) {
      // Mount the panel body in the same event as the shell opens so the first animated frame is never blank.
      setIsPanelContentMounted(true);
      toggleLeftSidebar(true);
    }
  };

  // Same shortcut builders know from code editors' app-wide search. It behaves like the Code search
  // rail icon (opens it, or closes it when it's already showing), except that a word selected in a
  // code editor seeds the search and always opens the panel.
  useHotkeys(
    'mod+shift+f',
    () => {
      const editorElement = document.activeElement?.closest?.('.cm-editor');
      const view = editorElement && EditorView.findFromDOM(editorElement);
      const { from, to } = view?.state.selection.main || {};
      const selected = view && from !== to ? view.state.sliceDoc(from, to) : '';
      if (selected && selected.length <= 100 && !selected.includes('\n')) {
        useStore.getState().setCodeSearchTerm(selected);
        if (selectedSidebarItem === 'search' && isSidebarOpen) return;
      }
      handleSelectedSidebarItem('search');
    },
    { enabled: currentMode !== 'view', enableOnFormTags: true, enableOnContentEditable: true, preventDefault: true },
    [selectedSidebarItem, isSidebarOpen, currentMode]
  );

  const setSideBarBtnRefs = (page) => (ref) => {
    sideBarBtnRefs.current[page] = ref;
  };

  useEffect(() => {
    if (!isDraggingQueryPane) {
      setPopoverContentHeight(getLeftPanelHeight(isQueryPaneExpanded, queryPanelHeight));
    } else {
      setPopoverContentHeight('calc(100vh - 48px)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight, isDraggingQueryPane, isQueryPaneExpanded]);

  useEffect(() => {
    if (isSidebarOpen) {
      setIsPanelContentMounted(true);
      return undefined;
    }

    const exitTimer = window.setTimeout(() => setIsPanelContentMounted(false), PANEL_MOTION.durationMs);
    return () => window.clearTimeout(exitTimer);
  }, [isSidebarOpen]);

  const renderPopoverContent = () => {
    if (panelItem === null) return null;
    const panelLabel = SIDEBAR_ITEMS[panelItem]?.name || 'Left sidebar';
    return (
      // Every sidebar panel gets its own labelled boundary; switching panels auto-recovers.
      <FallbackBoundary
        label={panelLabel}
        location={`LeftSideBar ${panelLabel}`}
        darkMode={darkMode}
        resetKeys={[panelItem]}
      >
        <div
          key={panelItem}
          className={cx('left-sidebar-panel-content', {
            'left-sidebar-panel-content--switching': animatePanelSwitch,
            // The panel renders in a portal, outside the editor's .theme-dark ancestor that dark-mode
            // rules (tabs, Bootstrap inputs) key on.
            'theme-dark': darkMode,
          })}
        >
          {renderSelectedPanel()}
        </div>
      </FallbackBoundary>
    );
  };

  const renderSelectedPanel = () => {
    switch (panelItem) {
      case 'tooljetai':
        return isAiBlockedByBranch ? null : renderAIChat({ darkMode });
      case 'pages':
        return <PageSettings surface="navigation" onClose={() => toggleLeftSidebar(false)} />;
      case 'components':
        return (
          <ComponentsManagerTab
            darkMode={darkMode}
            isModuleEditor={isModuleEditor}
            surface="left"
            onClose={() => toggleLeftSidebar(false)}
          />
        );
      case 'queries':
        return (
          <div className="left-sidebar-query-list">
            <QueryDataPane darkMode={darkMode} surface="left" onClose={() => toggleLeftSidebar(false)} />
          </div>
        );
      case 'search':
        return <CodeSearch darkMode={darkMode} onClose={() => toggleLeftSidebar(false)} moduleId={moduleId} />;
      case 'libraries':
        return <AppLibraries darkMode={darkMode} onClose={() => toggleLeftSidebar(false)} />;
      case 'security':
        return <SecurityPanel onClose={() => toggleLeftSidebar(false)} />;
      case 'access':
        return <AccessPanel onClose={() => toggleLeftSidebar(false)} />;
      case 'variables':
        return <VariablesPanel darkMode={darkMode} onClose={() => toggleLeftSidebar(false)} moduleId={moduleId} />;
      case 'dependencies':
        return <DependencyViewer darkMode={darkMode} onClose={() => toggleLeftSidebar(false)} moduleId={moduleId} />;
      case 'apphistory':
        return codeMode ? (
          <CodeHistoryPanel darkMode={darkMode} onClose={() => toggleLeftSidebar(false)} />
        ) : (
          <AppHistory darkMode={darkMode} onClose={() => toggleLeftSidebar(false)} />
        );
      case 'settings':
        return (
          <GlobalSettings
            darkMode={darkMode}
            isModuleEditor={isModuleEditor}
            onClose={() => toggleLeftSidebar(false)}
            onBackToSearch={returnToSearch ? () => handleSelectedSidebarItem('search') : undefined}
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
        {/* The AI chat sits first on the rail and opens in the left panel like every other item. */}
        {renderAISideBarTrigger({ darkMode, setSideBarBtnRefs, selectedSidebarItem, handleSelectedSidebarItem })}
        {/* A React builder app has no visual canvas, so no pages or widget palette (LP-M05, as on main). */}
        {!codeMode && (
          <>
            <SidebarItem
              selectedSidebarItem={selectedSidebarItem}
              onClick={() => handleSelectedSidebarItem('pages')}
              darkMode={darkMode}
              panel="pages"
              className="left-sidebar-item left-sidebar-layout"
              ref={setSideBarBtnRefs('pages')}
            >
              <Files size={16} strokeWidth={1.8} />
            </SidebarItem>
            <SidebarItem
              panel="components"
              selectedSidebarItem={selectedSidebarItem}
              darkMode={darkMode}
              onClick={() => handleSelectedSidebarItem('components')}
              className="left-sidebar-item left-sidebar-layout"
              ref={setSideBarBtnRefs('components')}
            >
              <Blocks size={16} strokeWidth={1.8} />
            </SidebarItem>
          </>
        )}
        <SidebarItem
          panel="queries"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => handleSelectedSidebarItem('queries')}
          className="left-sidebar-item left-sidebar-layout"
          ref={setSideBarBtnRefs('queries')}
        >
          <DatabaseZap size={16} strokeWidth={1.8} />
        </SidebarItem>
        <SidebarItem
          panel="variables"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => handleSelectedSidebarItem('variables')}
          className="left-sidebar-item left-sidebar-layout"
          ref={setSideBarBtnRefs('variables')}
        >
          <Variable size={16} strokeWidth={1.8} />
        </SidebarItem>
        {!codeMode && shouldShowLibraries(isModuleEditor, featureAccess?.appJsLibraries) && (
          <AppLibrariesIcon
            darkMode={darkMode}
            selectedSidebarItem={selectedSidebarItem}
            handleSelectedSidebarItem={handleSelectedSidebarItem}
            setSideBarBtnRefs={setSideBarBtnRefs}
          />
        )}
      </>
    );
  };

  const renderManageItems = () => (
    <>
      <div className="left-sidebar-section-divider" role="separator" />
      {!codeMode && (
        <SidebarItem
          panel="search"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => handleSelectedSidebarItem('search')}
          className="left-sidebar-item left-sidebar-layout tw-overflow-visible"
          ref={setSideBarBtnRefs('search')}
        >
          <Search size={16} strokeWidth={1.8} />
          <Beta className="code-search-beta-tag tw-py-0.5 tw-px-1.5 tw-border-none" />
        </SidebarItem>
      )}
      {(codeMode || buildMode === 'code') && !isModuleEditor && (
        <SidebarItem
          panel="security"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => handleSelectedSidebarItem('security')}
          className="left-sidebar-item left-sidebar-layout"
          ref={setSideBarBtnRefs('security')}
        >
          <ScanSearch size={16} strokeWidth={1.8} />
        </SidebarItem>
      )}
      {(codeMode || buildMode === 'code') && !isModuleEditor && (
        <SidebarItem
          panel="access"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => (accessInPlan ? handleSelectedSidebarItem('access') : setShowAccessUpgrade(true))}
          className="left-sidebar-item left-sidebar-layout"
          ref={setSideBarBtnRefs('access')}
        >
          <LockKeyhole size={16} strokeWidth={1.8} />
        </SidebarItem>
      )}
      {!codeMode && (
        <SidebarItem
          panel="dependencies"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => handleSelectedSidebarItem('dependencies')}
          className="left-sidebar-item left-sidebar-layout"
          ref={setSideBarBtnRefs('dependencies')}
        >
          <Network size={16} strokeWidth={1.8} />
        </SidebarItem>
      )}
      {/* Code mode: shown on every plan; below Pro it opens the upgrade prompt (the edition's component decides). */}
      {codeMode && !isModuleEditor && (
        <SidebarItem
          panel="apphistory"
          selectedSidebarItem={selectedSidebarItem}
          darkMode={darkMode}
          onClick={() => handleSelectedSidebarItem('apphistory')}
          className="left-sidebar-item left-sidebar-layout"
          ref={setSideBarBtnRefs('apphistory')}
        >
          <History size={16} strokeWidth={1.8} />
        </SidebarItem>
      )}
      {/* Shown on every plan; below Pro it opens the upgrade prompt (LP-M08). */}
      {!codeMode && !isModuleEditor && (
        <AppHistoryIcon
          darkMode={darkMode}
          selectedSidebarItem={selectedSidebarItem}
          handleSelectedSidebarItem={handleSelectedSidebarItem}
          setSideBarBtnRefs={setSideBarBtnRefs}
        />
      )}
      {renderSettingsItem(isModuleEditor)}
    </>
  );

  const renderSettingsItem = (isModuleEditor) => (
    <SidebarItem
      panel="settings"
      selectedSidebarItem={selectedSidebarItem}
      darkMode={darkMode}
      // eslint-disable-next-line no-unused-vars
      onClick={(e) => handleSelectedSidebarItem('settings')}
      className={`left-sidebar-item  left-sidebar-layout`}
      badge={true}
      ref={setSideBarBtnRefs('settings')}
      isModuleEditor={isModuleEditor}
    >
      <Settings size={16} strokeWidth={1.8} />
    </SidebarItem>
  );

  const renderLeftSidebarItems = () => (
    <>
      {renderCommonItems()}
      {renderManageItems()}
    </>
  );

  return (
    <>
      <div
        className={cx('left-sidebar !tw-z-10', { 'dark-theme theme-dark': darkMode })}
        data-cy="left-sidebar-inspector"
        style={{ zIndex: 9999, maxWidth: '304px' }}
      >
        {renderLeftSidebarItems()}
        {shouldMountLeftPanel && (
          <Popover
            forceMount
            // Left panels close only from their own close button or rail icon — never from an
            // outside click (canvas, right panel, bottom panel, AI chat).
            onInteractOutside={(e) => e.preventDefault()}
            open={isLeftPanelOpen}
            popoverContentClassName={`tj-panel p-0 left-sidebar-scrollbar sidebar-h-100-popover ${panelItem} left-sidebar-overflow-${getLeftPanelOverflow(
              panelItem
            )}`}
            side="right"
            popoverContent={isPanelContentMounted ? renderPopoverContent() : null}
            popoverContentHeight={popoverContentHeight}
            contentProps={{
              onOpenAutoFocus: (e) => e.preventDefault(),
            }}
          />
        )}
        <div className="left-sidebar-stack-bottom">
          <div className="tw-flex tw-flex-col tw-gap-2">
            {shouldEnableMultiplayer && <AvatarGroupWrapper darkMode={darkMode} maxDisplay={2} />}
            {shouldEnableMultiplayer && <UpdatePresenceMultiPlayer />}
            <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
            <SupportButton darkMode={darkMode} />
          </div>
        </div>
      </div>
      {showAccessUpgrade && (
        <LegalReasonsErrorModal
          showModal
          toggleModal={() => setShowAccessUpgrade(false)}
          darkMode={darkMode}
          edition={fetchEdition()}
          message="Screen and query permissions are not included in your current plan. Upgrade your plan to use Access permissions."
        />
      )}
    </>
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
    return onePerPerson(mergedAvatars.map((other) => other.presence)).map((presence) => ({
      ...presence,
      text: getAvatarText(presence),
      title: getAvatarTitle(presence),
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
