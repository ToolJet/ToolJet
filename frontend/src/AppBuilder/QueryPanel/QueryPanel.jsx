import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PanelBottomClose, PanelBottomOpen } from 'lucide-react';
import { isEmpty, isEqual } from 'lodash';
import { diff } from 'deep-object-diff';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';

import { useEventListener } from '@/_hooks/use-event-listener';
import useWindowResize from '@/_hooks/useWindowResize';
import useStore from '@/AppBuilder/_stores/store';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import LeftSidebarInspector from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/LeftSidebarInspector';
import Debugger from '@/AppBuilder/LeftSidebar/Debugger/Debugger';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import {
  RUNTIME_PANEL_COLLAPSED_HEIGHT,
  RUNTIME_PANEL_ITEMS,
  PANEL_MOTION,
  getRuntimePanelContentStyle,
  getRuntimePanelMeasuredHeight,
  getRuntimePanelTheme,
} from '@/AppBuilder/panelLayout';

export const QueryPanel = ({ darkMode }) => {
  const { moduleId, appType } = useModuleContext();
  const setQueryPanelHeight = useStore((state) => state.queryPanel.setQueryPanelHeight);
  const isDraggingQueryPane = useStore((state) => state.queryPanel.isDraggingQueryPane, shallow);
  const setIsDraggingQueryPane = useStore((state) => state.queryPanel.setIsDraggingQueryPane, shallow);
  const isQueryPaneExpanded = useStore((state) => state.queryPanel.isQueryPaneExpanded, shallow);
  const setIsQueryPaneExpanded = useStore((state) => state.queryPanel.setIsQueryPaneExpanded, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);
  const unreadErrorCount = useStore((state) => state.debugger.unreadErrorCount);
  const resetUnreadErrorCount = useStore((state) => state.debugger.resetUnreadErrorCount);
  const selectedQueryId = useStore((state) => state.queryPanel.selectedQuery?.id);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const [activeTab, setActiveTab] = useState('inspect');
  const [renderPanelContent, setRenderPanelContent] = useState(isQueryPaneExpanded);
  const panelPreferences = useRef(
    JSON.parse(localStorage.getItem('runtimePanelPreferences')) ?? { isExpanded: false, panelTop: 70 }
  );
  const panelRef = useRef(null);
  const [height, setHeight] = useState(panelPreferences.current.panelTop ?? 70);
  const [isResizeHandleActive, setResizeHandleActive] = useState(false);
  const [windowSize, isWindowResizing] = useWindowResize();

  useEffect(() => {
    const unsubscribe = useStore.subscribe(({ queryPanel: { selectedQuery } }, prevState) => {
      if (isEmpty(prevState?.queryPanel?.selectedQuery) || isEmpty(selectedQuery)) return;
      if (prevState?.queryPanel?.selectedQuery?.id !== selectedQuery.id) return;
      const formattedQuery = deepClone(selectedQuery);
      const formattedPreviousQuery = deepClone(prevState?.queryPanel?.selectedQuery || {});
      delete formattedQuery.updated_at;
      delete formattedPreviousQuery.updated_at;
      const queryDiff = diff(formattedPreviousQuery, formattedQuery);
      const onlyNameChanged = Object.keys(queryDiff).length === 1 && 'name' in queryDiff;
      if (!isEqual(formattedQuery, formattedPreviousQuery) && !onlyNameChanged) {
        useStore.getState().dataQuery.saveData(selectedQuery);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const measuredHeight = panelRef.current?.offsetHeight ?? RUNTIME_PANEL_COLLAPSED_HEIGHT;
    setQueryPanelHeight(getRuntimePanelMeasuredHeight(isQueryPaneExpanded, measuredHeight));
  }, [windowSize.height, isQueryPaneExpanded, isWindowResizing, setQueryPanelHeight]);

  useEffect(() => {
    if (isQueryPaneExpanded) {
      setRenderPanelContent(true);
      return undefined;
    }

    const exitTimer = window.setTimeout(() => setRenderPanelContent(false), PANEL_MOTION.durationMs);
    return () => window.clearTimeout(exitTimer);
  }, [isQueryPaneExpanded]);

  useEffect(() => {
    if (!selectedQueryId) return;
    setActiveRightSideBarTab('query');
    setRightSidebarOpen(true);
  }, [selectedQueryId, setActiveRightSideBarTab, setRightSidebarOpen]);

  const persistPanel = useCallback((expanded, panelTop) => {
    panelPreferences.current = { isExpanded: expanded, panelTop: panelTop ?? panelPreferences.current.panelTop };
    localStorage.setItem('runtimePanelPreferences', JSON.stringify(panelPreferences.current));
  }, []);

  const toggleRuntimePanel = useCallback(() => {
    const expanded = !isQueryPaneExpanded;
    setIsQueryPaneExpanded(expanded);
    persistPanel(expanded, height);
    if (!expanded) setQueryPanelHeight(0);
  }, [height, isQueryPaneExpanded, persistPanel, setIsQueryPaneExpanded, setQueryPanelHeight]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'debugger') resetUnreadErrorCount();
    if (!isQueryPaneExpanded) {
      setIsQueryPaneExpanded(true);
      persistPanel(true, height);
    }
  };

  const onMouseMove = useCallback(
    (event) => {
      if (!panelRef.current) return;
      const panelTop = Math.round(panelRef.current.getBoundingClientRect().top);
      const overHandle = event.clientY >= panelTop && event.clientY <= panelTop + 3;
      if (overHandle !== isResizeHandleActive) setResizeHandleActive(overHandle);
      if (isDraggingQueryPane) setHeight(Math.min(Math.max((event.clientY / window.innerHeight) * 100, 45), 92));
    },
    [isDraggingQueryPane, isResizeHandleActive]
  );

  useEventListener('mousemove', onMouseMove);
  useEventListener(
    'mouseup',
    () => {
      if (!isDraggingQueryPane) return;
      setIsDraggingQueryPane(false);
      persistPanel(true, height);
      setQueryPanelHeight(panelRef.current?.offsetHeight ?? RUNTIME_PANEL_COLLAPSED_HEIGHT);
    },
    document
  );

  const rightPanelOffset = { right: isRightSidebarOpen ? '300px' : 0 };
  const runtimePanelTheme = getRuntimePanelTheme(darkMode);
  const runtimePanelBarStyle = {
    ...rightPanelOffset,
    '--runtime-panel-background': runtimePanelTheme.panel,
    '--runtime-panel-text': runtimePanelTheme.text,
    '--runtime-panel-muted': runtimePanelTheme.muted,
    '--runtime-panel-border': runtimePanelTheme.border,
    '--runtime-panel-accent': runtimePanelTheme.accent,
  };

  return (
    <div className={cx('runtime-panel', { 'dark-theme theme-dark': darkMode })}>
      <div className="query-pane runtime-panel-bar" style={runtimePanelBarStyle}>
        {RUNTIME_PANEL_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            className={cx('runtime-panel-tab', { active: activeTab === id })}
            onClick={() => selectTab(id)}
          >
            <span>{label}</span>
            {id === 'debugger' && unreadErrorCount > 0 && (
              <span className="runtime-panel-badge">{unreadErrorCount}</span>
            )}
          </button>
        ))}
        <button className="runtime-panel-toggle" onClick={toggleRuntimePanel} aria-label="Toggle runtime panel">
          {isQueryPaneExpanded ? <PanelBottomClose size={14} /> : <PanelBottomOpen size={14} />}
        </button>
      </div>
      <div
        ref={panelRef}
        className={cx('query-pane runtime-panel-content', { expanded: isQueryPaneExpanded })}
        data-state={isQueryPaneExpanded ? 'open' : 'closed'}
        style={{
          ...getRuntimePanelContentStyle(isQueryPaneExpanded, height),
          ...rightPanelOffset,
          cursor: isDraggingQueryPane || isResizeHandleActive ? 'row-resize' : 'default',
        }}
        onMouseDown={(event) => {
          if (!isResizeHandleActive) return;
          event.preventDefault();
          setIsDraggingQueryPane(true);
        }}
      >
        {renderPanelContent && (
          <FallbackBoundary label="Runtime panel" location="Runtime Panel" darkMode={darkMode} resetKeys={[activeTab]}>
            <div className="runtime-panel-body">
              {activeTab === 'inspect' && (
                <LeftSidebarInspector
                  darkMode={darkMode}
                  onClose={toggleRuntimePanel}
                  moduleId={moduleId}
                  appType={appType}
                />
              )}
              {activeTab === 'debugger' && <Debugger darkMode={darkMode} onClose={toggleRuntimePanel} />}
            </div>
          </FallbackBoundary>
        )}
      </div>
    </div>
  );
};
