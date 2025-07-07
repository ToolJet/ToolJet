import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Container } from './Container';
import Grid from './Grid';
import { EditorSelecto } from './Selecto';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
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
import PagesSidebarNavigation from '../RightSideBar/PageSettingsTab/PageMenu/PagesSidebarNavigation';
import { resolveReferences } from '@/_helpers/utils';
import useRightSidebarMargin from './userRightSidebarMargin';
import { DragGhostWidget } from './GhostWidgets';
import AppCanvasBanner from '../../AppBuilder/Header/AppCanvasBanner';

export const AppCanvas = ({ appId, isViewer = false, switchDarkMode, darkMode }) => {
  const { moduleId, isModuleMode, appType } = useModuleContext();
  const canvasContainerRef = useRef();
  const handleCanvasContainerMouseUp = useStore((state) => state.handleCanvasContainerMouseUp, shallow);
  const canvasHeight = useStore((state) => state.appStore.modules[moduleId].canvasHeight);
  const creationMode = useStore((state) => state.appStore.modules[moduleId].app.creationMode);
  const environmentLoadingState = useStore(
    (state) => state.environmentLoadingState || state.loaderStore.modules[moduleId].isEditorLoading
  );
  const [canvasWidth, setCanvasWidth] = useState(getCanvasWidth(moduleId));
  const gridWidth = canvasWidth / NO_OF_GRIDS;
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
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
  // const editorMarginRight = useRightSidebarMargin(canvasContainerRef);
  // const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const isSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);
  const getPageId = useStore((state) => state.getCurrentPageId, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned, shallow);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);

  const [isViewerSidebarPinned, setIsSidebarPinned] = useState(
    localStorage.getItem('isPagesSidebarPinned') !== 'false'
  );

  const { globalSettings, pages, pageSettings, switchPage } = useStore(
    (state) => ({
      globalSettings: state.globalSettings,
      pages: state.modules.canvas.pages,
      pageSettings: state.pageSettings,
      switchPage: state.switchPage,
    }),
    shallow
  );

  const showHeader = !globalSettings?.hideHeader;
  const { definition: { styles = {}, properties = {} } = {} } = pageSettings ?? {};
  const { position, disableMenu, showOnDesktop } = properties ?? {};
  const isPagesSidebarHidden = resolveReferences(disableMenu?.value);

  const hideSidebar = isModuleMode || isPagesSidebarHidden || appType === 'module';

  useEffect(() => {
    // Need to remove this if we shift setExposedVariable Logic outside of components
    // Currently present to run onLoadQueries after the component is mounted
    setIsComponentLayoutReady(true, moduleId);
    return () => setIsComponentLayoutReady(false, moduleId);
  }, []);

  useEffect(() => {
    function handleResize() {
      const _canvasWidth =
        moduleId === 'canvas'
          ? document.getElementById('real-canvas')?.getBoundingClientRect()?.width
          : document.getElementById(moduleId)?.getBoundingClientRect()?.width;
      if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
    }

    if (moduleId === 'canvas') {
      window.addEventListener('resize', handleResize);
    } else {
      const elem = document.getElementById(moduleId);
      const resizeObserver = new ResizeObserver(handleResize);
      if (elem) resizeObserver.observe(elem);

      return () => {
        if (elem) resizeObserver.unobserve(elem);
        resizeObserver.disconnect();
      };
    }
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [currentLayout, canvasMaxWidth, isViewerSidebarPinned, moduleId, isRightSidebarOpen]);

  useEffect(() => {}, [isViewerSidebarPinned]);

  const canvasContainerStyles = useMemo(() => {
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
      width: currentMode === 'edit' ? `calc(100% - 96px)` : '100%',
      alignItems: 'unset',
      justifyContent: 'unset',
      borderRight: currentMode === 'edit' && isRightSidebarOpen && '299' + 'px solid',
      padding: currentMode === 'edit' && '8px',
      paddingBottom: currentMode === 'edit' && '2px',
    };
  }, [currentMode, isAppDarkMode, isModuleMode, editorMarginLeft, canvasContainerHeight, isRightSidebarOpen]);

  const toggleSidebarPinned = useCallback(() => {
    const newValue = !isViewerSidebarPinned;
    setIsSidebarPinned(newValue);
    localStorage.setItem('isPagesSidebarPinned', JSON.stringify(newValue));
  }, [isViewerSidebarPinned]);

  function getMinWidth() {
    if (isModuleMode) return '100%';

    const shouldAdjust = isSidebarOpen || (isRightSidebarOpen && currentMode === 'edit');

    if (!shouldAdjust) return '';

    let offset;
    if (isViewerSidebarPinned) {
      offset = position === 'side' ? '352px' : '126px';
    } else {
      offset = position === 'side' ? '171px' : '126px';
    }

    return `calc(100vw - ${offset})`;
  }

  return (
    <div
      className={cx(`main main-editor-canvas position-relative`, {})}
      id="main-editor-canvas"
      onMouseUp={handleCanvasContainerMouseUp}
    >
      <AppCanvasBanner appId={appId} />
      <div id="sidebar-page-navigation" className="areas d-flex flex-rows">
        <div
          ref={canvasContainerRef}
          className={cx(
            'canvas-container d-flex page-container',
            { 'dark-theme theme-dark': isAppDarkMode, close: !isViewerSidebarPinned },
            { 'overflow-x-auto': currentMode === 'edit' },
            { 'position-top': position === 'top' },
            { 'overflow-x-hidden': moduleId !== 'canvas' } // Disbling horizontal scroll for modules in view mode
          )}
          style={canvasContainerStyles}
        >
          {showOnDesktop && appType !== 'module' && (
            <PagesSidebarNavigation
              showHeader={showHeader}
              isMobileDevice={currentLayout === 'mobile'}
              pages={pages}
              currentPageId={currentPageId ?? homePageId}
              switchPage={switchPage}
              height={currentMode === 'edit' ? canvasContainerHeight : '100%'}
              switchDarkMode={switchDarkMode}
              isSidebarPinned={isViewerSidebarPinned}
              toggleSidebarPinned={toggleSidebarPinned}
              darkMode={darkMode}
            />
          )}
          <div
            style={{
              minWidth: getMinWidth(),
              scrollbarWidth: 'none',
              overflow: 'auto',
              width: currentMode === 'view' ? `calc(100% - ${isViewerSidebarPinned ? '0px' : '0px'})` : '100%',
              ...(appType === 'module' && isModuleMode && { height: 'inherit' }),
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
                    pagePositionType={position}
                    appType={appType}
                  />
                  <DragGhostWidget />
                  <div id="component-portal" />
                  {appType !== 'module' && <div id="component-portal" />}
                </div>
              )}

              {currentMode === 'view' || (currentLayout === 'mobile' && isAutoMobileLayout) ? null : (
                <Grid currentLayout={currentLayout} gridWidth={gridWidth} />
              )}
            </HotkeyProvider>
          </div>
        </div>
      </div>
      {currentMode === 'edit' && <EditorSelecto />}
    </div>
  );
};
