import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container } from './Container';
import Grid from './Grid';
import { EditorSelecto } from './Selecto';
import { useModuleId, useIsModuleMode } from '@/AppBuilder/_contexts/ModuleContext';
import { HotkeyProvider } from './HotkeyProvider';
import './appCanvas.scss';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { computeViewerBackgroundColor, getCanvasWidth } from './appCanvasUtils';
import { NO_OF_GRIDS } from './appCanvasConstants';
import cx from 'classnames';
import FreezeVersionInfo from '@/AppBuilder/Header/FreezeVersionInfo';
import { computeCanvasContainerHeight } from '../_helpers/editorHelpers';
import AutoComputeMobileLayoutAlert from './AutoComputeMobileLayoutAlert';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import useAppCanvasMaxWidth from './useAppCanvasMaxWidth';
import { DeleteWidgetConfirmation } from './DeleteWidgetConfirmation';
import useSidebarMargin from './useSidebarMargin';

export const AppCanvas = ({ appId, isViewerSidebarPinned, appType }) => {
  const canvasContainerRef = useRef();
  const handleCanvasContainerMouseUp = useStore((state) => state.handleCanvasContainerMouseUp, shallow);
  const canvasHeight = useStore((state) => state.canvasHeight);
  const creationMode = useStore((state) => state.app.creationMode);
  const environmentLoadingState = useStore((state) => state.environmentLoadingState || state.isEditorLoading);
  const [canvasWidth, setCanvasWidth] = useState(getCanvasWidth());
  const gridWidth = canvasWidth / NO_OF_GRIDS;
  const currentMode = useStore((state) => state.currentMode, shallow);
  const pageSidebarStyle = useStore((state) => state?.pageSettings?.definition?.properties?.style, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const queryPanelHeight = useStore((state) => state?.queryPanel?.queryPanelHeight || 0);
  const isDraggingQueryPane = useStore((state) => state.queryPanel.isDraggingQueryPane, shallow);
  const { isAppDarkMode } = useAppDarkMode();
  const canvasBgColor = useStore((state) => state.getCanvasBackgroundColor('canvas', isAppDarkMode), shallow);
  const canvasContainerHeight = computeCanvasContainerHeight(queryPanelHeight, isDraggingQueryPane);
  const isAutoMobileLayout = useStore((state) => state.getIsAutoMobileLayout(), shallow);
  const setIsComponentLayoutReady = useStore((state) => state.setIsComponentLayoutReady, shallow);
  const canvasMaxWidth = useAppCanvasMaxWidth({ mode: currentMode });
  const editorMarginLeft = useSidebarMargin(canvasContainerRef);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const getPageId = useStore((state) => state.getCurrentPageId, shallow);
  const moduleId = useModuleId();
  const isModuleMode = useIsModuleMode();

  const hideSidebar = isModuleMode || isPagesSidebarHidden;

  useEffect(() => {
    // Need to remove this if we shift setExposedVariable Logic outside of components
    // Currently present to run onLoadQueries after the component is mounted
    setIsComponentLayoutReady(true);
    return () => setIsComponentLayoutReady(false);
  }, []);

  useEffect(() => {
    function handleResize() {
      const _canvasWidth = document.getElementById('real-canvas')?.getBoundingClientRect()?.width;
      if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [currentLayout, canvasMaxWidth, isViewerSidebarPinned]);

  const styles = useMemo(() => {
    const canvasBgColor =
      currentMode === 'view'
        ? computeViewerBackgroundColor(isAppDarkMode, canvasBgColor)
        : !isAppDarkMode
        ? '#EBEBEF'
        : '#2F3C4C';

    if (isModuleMode) {
      return {
        borderLeft: 'none',
        height: '100%',
        background: canvasBgColor,
      };
    }

    return {
      borderLeft: currentMode === 'edit' && editorMarginLeft + 'px solid',
      height: currentMode === 'edit' ? canvasContainerHeight : '100%',
      background: canvasBgColor,
      marginLeft:
        isViewerSidebarPinned && !hideSidebar && currentLayout !== 'mobile' && currentMode !== 'edit'
          ? pageSidebarStyle === 'icon'
            ? '65px'
            : '210px'
          : 'auto',
    };
  }, [
    currentMode,
    isAppDarkMode,
    isModuleMode,
    editorMarginLeft,
    canvasContainerHeight,
    isViewerSidebarPinned,
    hideSidebar,
    currentLayout,
    pageSidebarStyle,
  ]);

  return (
    <div
      className={cx(`main main-editor-canvas position-relative`, {})}
      id="main-editor-canvas"
      onMouseUp={handleCanvasContainerMouseUp}
    >
      {creationMode === 'GIT' && <FreezeVersionInfo info={'Apps imported from git repository cannot be edited'} />}
      {creationMode !== 'GIT' && <FreezeVersionInfo hide={currentMode !== 'edit'} />}
      <div
        ref={canvasContainerRef}
        className={cx(
          'canvas-container align-items-center page-container',
          { 'dark-theme theme-dark': isAppDarkMode, close: !isViewerSidebarPinned },
          { 'overflow-x-auto': (currentMode === 'edit' && isSidebarOpen) || currentMode === 'view' }
        )}
        style={styles}
      >
        <div
          style={{
            minWidth: `calc((100vw - 300px) - 48px)`,
          }}
          className={`app-${appId} _tooljet-page-${getPageId()}`}
        >
          {currentMode === 'edit' && (
            <AutoComputeMobileLayoutAlert currentLayout={currentLayout} darkMode={isAppDarkMode} />
          )}
          <DeleteWidgetConfirmation darkMode={isAppDarkMode} />
          <HotkeyProvider mode={currentMode} canvasMaxWidth={canvasMaxWidth} currentLayout={currentLayout}>
            {environmentLoadingState !== 'loading' && (
              <div>
                <Container
                  id={moduleId}
                  gridWidth={gridWidth}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  darkMode={isAppDarkMode}
                  canvasMaxWidth={canvasMaxWidth}
                  isViewerSidebarPinned={isViewerSidebarPinned}
                  pageSidebarStyle={pageSidebarStyle}
                  appType={appType}
                />
                <div id="component-portal" />
              </div>
            )}

            {currentMode === 'view' || (currentLayout === 'mobile' && isAutoMobileLayout) ? null : (
              <Grid currentLayout={currentLayout} gridWidth={gridWidth} appType={appType} />
            )}
          </HotkeyProvider>
        </div>
      </div>
      {currentMode === 'edit' && <EditorSelecto />}
    </div>
  );
};
