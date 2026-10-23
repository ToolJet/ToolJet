import React, { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { ComponentConfigurationTab } from './ComponentConfigurationTab';
import cx from 'classnames';
import { PageSettings } from './PageSettingsTab';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from './rightSidebarConstants';
import QueryManager from '@/AppBuilder/QueryManager/QueryManager';
import {
  getQueryHeaderControlPresentation,
  getRightPanelClassName,
  getRightPanelStyle,
  PANEL_MOTION,
} from '@/AppBuilder/panelLayout';
import { AddEditPagePopup } from './PageSettingsTab/PageMenu/AddNewPagePopup';
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
        style={getRightPanelStyle(displayedTab)}
        className={cx(
          getRightPanelClassName(displayedTab),
          { 'dark-theme theme-dark': darkMode },
          { 'tw-pointer-events-none': shouldFreeze }
        )}
        data-state={isRightSidebarOpen ? 'open' : 'closed'}
      >
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
                  <QueryManager darkMode={darkMode} surface="right" />
                </div>
              </FallbackBoundary>
            )}
          </FallbackBoundary>
        </div>
      </div>
    </div>
  );
};
