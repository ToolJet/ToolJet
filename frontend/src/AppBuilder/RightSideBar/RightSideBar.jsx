import React, { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from './rightSidebarConstants';
import QueryManager from '@/AppBuilder/QueryManager/QueryManager';
import QueryKeyHooks from '@/AppBuilder/QueryPanel/QueryKeyHooks';
import {
  getQueryHeaderControlPresentation,
  getLeftPanelState,
  getRightPanelClassName,
  getRightPanelStyle,
  PANEL_MOTION,
} from '@/AppBuilder/panelLayout';
import { AddEditPagePopup } from './PageSettingsTab/PageMenu/AddNewPagePopup';
import { QueryPanelResizeHandle } from './QueryPanelResizeHandle';
import { LEFT_SIDEBAR_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import './rightSidebar.scss';
import { Button } from '@/components/ui/Button/Button';

export const RightSideBar = ({ darkMode }) => {
  const closeControl = getQueryHeaderControlPresentation('close');
  const { isModuleEditor } = useModuleContext();
  const shouldFreeze = useStore((state) => state.getShouldFreeze(false, isModuleEditor));
  const activeTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const queryPanelWidth = useStore((state) => state.queryPanel.queryPanelWidth);
  const setQueryPanelWidth = useStore((state) => state.queryPanel.setQueryPanelWidth);
  const selectedSidebarItem = useStore((state) => state.selectedSidebarItem);
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen);
  const { isLeftPanelOpen } = getLeftPanelState(selectedSidebarItem, isLeftSidebarOpen);
  const leftPanelWidth = isLeftPanelOpen ? (LEFT_SIDEBAR_WIDTH[selectedSidebarItem] ?? LEFT_SIDEBAR_WIDTH.default) : 0;
  const [isPanelMounted, setIsPanelMounted] = useState(isRightSidebarOpen);
  const [renderedTab, setRenderedTab] = useState(activeTab);

  useEffect(() => {
    if (activeTab) setRenderedTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isRightSidebarOpen) {
      setIsPanelMounted(true);
      return undefined;
    }

    const exitTimer = window.setTimeout(() => setIsPanelMounted(false), PANEL_MOTION.durationMs);
    return () => window.clearTimeout(exitTimer);
  }, [isRightSidebarOpen]);

  if (!isRightSidebarOpen && !isPanelMounted) return null;

  const displayedTab = activeTab ?? renderedTab;

  return (
    <div className="sub-section">
      <div
        style={getRightPanelStyle(displayedTab, queryPanelWidth)}
        className={cx(
          getRightPanelClassName(displayedTab, isLeftPanelOpen),
          { 'dark-theme theme-dark': darkMode },
          // The query panel freezes its own controls; Run, Preview and close stay usable on a frozen version.
          { 'tw-pointer-events-none': shouldFreeze && displayedTab !== RIGHT_SIDE_BAR_TAB.QUERY }
        )}
        data-state={isRightSidebarOpen ? 'open' : 'closed'}
      >
        {displayedTab === RIGHT_SIDE_BAR_TAB.QUERY && isRightSidebarOpen && (
          <QueryPanelResizeHandle
            onResize={setQueryPanelWidth}
            onResizeEnd={(width) => setQueryPanelWidth(width, { persist: true })}
            leftPanelWidth={leftPanelWidth}
          />
        )}
        <div
          key={displayedTab}
          className={cx('right-panel-content', { 'dark-theme theme-dark': darkMode })}
          style={{ position: 'relative', height: '100%' }}
        >
          {/* Catch-all for anything the tab-level boundaries don't cover. */}
          <FallbackBoundary
            label="Right sidebar"
            location="Right SideBar"
            darkMode={darkMode}
            resetKeys={[displayedTab]}
          >
            {displayedTab === RIGHT_SIDE_BAR_TAB.PAGES && (
              <FallbackBoundary label="Page settings" location="Page Settings" darkMode={darkMode}>
                <PageSettings surface="configuration" />
              </FallbackBoundary>
            )}
            {displayedTab === RIGHT_SIDE_BAR_TAB.PAGE_CONFIGURATION && (
              <FallbackBoundary label="Page configuration" location="Page Configuration" darkMode={darkMode}>
                <div className="page-configuration-panel">
                  <AddEditPagePopup
                    darkMode={darkMode}
                    embedded
                    onClose={() => {
                      useStore.getState().setNewPagePopupConfig({ show: false, mode: null, type: null });
                      useStore.getState().setEditingPage(null);
                      setActiveRightSideBarTab(null);
                      setRightSidebarOpen(false);
                    }}
                  />
                </div>
              </FallbackBoundary>
            )}
            {/* Add component lives only in the left panel; the right side never shows it. */}
            {displayedTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION && (
              <ComponentConfigurationTab darkMode={darkMode} isModuleEditor={isModuleEditor} />
            )}
            {displayedTab === RIGHT_SIDE_BAR_TAB.QUERY && (
              <FallbackBoundary label="Query configuration" location="Right SideBar Query" darkMode={darkMode}>
                <div className="right-sidebar-query-configuration">
                  <Button
                    isLucid
                    iconOnly
                    size={closeControl.size}
                    variant="ghost"
                    leadingIcon="x"
                    className={cx('right-sidebar-query-close', closeControl.className)}
                    style={{ '--query-header-close-icon-size': `${closeControl.iconSizePx}px` }}
                    aria-label="Close query configuration"
                    onClick={() => {
                      setActiveRightSideBarTab(null);
                      setRightSidebarOpen(false);
                    }}
                  />
                  {/* Run, preview and stop shortcuts, live while the query is on screen. */}
                  <QueryKeyHooks isExpanded={isRightSidebarOpen}>
                    <QueryManager darkMode={darkMode} surface="right" />
                  </QueryKeyHooks>
                </div>
              </FallbackBoundary>
            )}
          </FallbackBoundary>
        </div>
      </div>
    </div>
  );
};
