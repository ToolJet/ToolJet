import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { debounce } from 'lodash';
import { shallow } from 'zustand/shallow';
import './appCanvas.scss';

import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { HotkeyProvider } from './HotkeyProvider';
import useStore from '@/AppBuilder/_stores/store';
import { computeViewerBackgroundColor, getCanvasWidth } from './appCanvasUtils';
import { NO_OF_GRIDS } from './appCanvasConstants';
import cx from 'classnames';
import { computeCanvasContainerHeight } from '../_helpers/editorHelpers';
import AutoComputeMobileLayoutAlert from './AutoComputeMobileLayoutAlert';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import useAppCanvasMaxWidth from './useAppCanvasMaxWidth';
import { DeleteWidgetConfirmation } from './DeleteWidgetConfirmation';
import useSidebarMargin from './useSidebarMargin';
import { DragResizeGhostWidget } from './GhostWidgets';

import { Container } from './Container';
import PagesSidebarNavigation from '../RightSideBar/PageSettingsTab/PageMenu/PagesSidebarNavigation';

// Lazy load editor-only component to reduce viewer bundle size
const AppCanvasBanner = lazy(() => import('@/AppBuilder/Header/AppCanvasBanner'));
const EditorSelecto = React.lazy(() => import('./Selecto'));
const Grid = React.lazy(() => import('./Grid'));
import useCanvasMinWidth from './useCanvasMinWidth';
import useEnableMainCanvasScroll from './useEnableMainCanvasScroll';

export const AppCanvas = ({ appId, switchDarkMode, darkMode }) => {
  const { moduleId, isModuleMode, appType } = useModuleContext();
  const canvasContainerRef = useRef();
  const canvasContentRef = useRef(null);
  const isScrolling = useEnableMainCanvasScroll({ canvasContentRef });
  const handleCanvasContainerMouseUp = useStore((state) => state.handleCanvasContainerMouseUp, shallow);
  const canvasHeight = useStore((state) => state.appStore.modules[moduleId].canvasHeight);
  const environmentLoadingState = useStore(
    (state) => state.environmentLoadingState || state.loaderStore.modules[moduleId].isEditorLoading,
    shallow
  );
  const [canvasWidth, setCanvasWidth] = useState(getCanvasWidth(moduleId));
  const gridWidth = canvasWidth / NO_OF_GRIDS;
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const pageSidebarStyle = useStore((state) => state?.pageSettings?.definition?.properties?.style, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const queryPanelHeight = useStore((state) => state?.queryPanel?.queryPanelHeight || 0);
  const isDraggingQueryPane = useStore((state) => state.queryPanel.isDraggingQueryPane, shallow);
  const { isAppDarkMode } = useAppDarkMode();
  const canvasContainerHeight = computeCanvasContainerHeight(queryPanelHeight, isDraggingQueryPane);
  const isAutoMobileLayout = useStore((state) => state.getIsAutoMobileLayout(), shallow);
  const setIsComponentLayoutReady = useStore((state) => state.setIsComponentLayoutReady, shallow);
  const canvasMaxWidth = useAppCanvasMaxWidth({ mode: currentMode });
  const editorMarginLeft = useSidebarMargin(canvasContainerRef);
  const getPageId = useStore((state) => state.getCurrentPageId, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const [isViewerSidebarPinned, setIsSidebarPinned] = useState(
    localStorage.getItem('isPagesSidebarPinned') === null
      ? false
      : localStorage.getItem('isPagesSidebarPinned') !== 'false'
  );

  const { globalSettings, pageSettings, switchPage } = useStore(
    (state) => ({
      globalSettings: state.globalSettings,
      pageSettings: state.pageSettings,
      switchPage: state.switchPage,
    }),
    shallow
  );
  const showHeader = !globalSettings?.hideHeader;
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const { position } = properties ?? {};
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);
  const minCanvasWidth = useCanvasMinWidth({ currentMode, position, isModuleMode });

  useEffect(() => {
    // Need to remove this if we shift setExposedVariable Logic outside of components
    // Currently present to run onLoadQueries after the component is mounted
    setIsComponentLayoutReady(true, moduleId);
    return () => setIsComponentLayoutReady(false, moduleId);
  }, []);

  const handleResizeImmediate = useCallback(() => {
    const _canvasWidth =
      moduleId === 'canvas'
        ? document.getElementById('real-canvas')?.getBoundingClientRect()?.width
        : document.getElementById(moduleId)?.getBoundingClientRect()?.width;
    if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
  }, [moduleId]);

  useEffect(() => {
    const handleResize = debounce(handleResizeImmediate, 300);

    if (moduleId === 'canvas') {
      window.addEventListener('resize', handleResize);
    } else {
      const elem = document.getElementById(moduleId);
      const resizeObserver = new ResizeObserver(handleResize);
      if (elem) resizeObserver.observe(elem);

      return () => {
        if (elem) resizeObserver.unobserve(elem);
        resizeObserver.disconnect();
        handleResize.cancel();
      };
    }
    handleResizeImmediate();

    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [handleResizeImmediate, currentLayout, canvasMaxWidth, moduleId, isRightSidebarOpen]);

  useEffect(() => {
    if (moduleId === 'canvas') {
      const _canvasWidth =
        document.querySelector('.canvas-container.page-container')?.getBoundingClientRect()?.width -
        (isViewerSidebarPinned ? 272 : 70); // expanded and collapsed sidebar width + padding of above container
      if (_canvasWidth !== 0) setCanvasWidth(_canvasWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewerSidebarPinned]);

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
      borderRight: currentMode === 'edit' && isRightSidebarOpen && `300px solid ${canvasBgColor}`,
      padding: currentMode === 'edit' && '8px',
    };
  }, [currentMode, isAppDarkMode, isModuleMode, editorMarginLeft, canvasContainerHeight, isRightSidebarOpen]);

  return (
    <div
      className={cx(`main main-editor-canvas position-relative`, {})}
      id="main-editor-canvas"
      onMouseUp={handleCanvasContainerMouseUp}
    >
      {currentMode === 'edit' && (
        <Suspense fallback={null}>
          <AppCanvasBanner appId={appId} />
        </Suspense>
      )}
      <div id="sidebar-page-navigation" className="areas d-flex flex-rows">
        <div
          ref={canvasContainerRef}
          className={cx(
            'canvas-container d-flex page-container',
            { 'dark-theme theme-dark': isAppDarkMode, close: !isViewerSidebarPinned },
            { 'overflow-x-auto': currentMode === 'edit' },
            { 'position-top': position === 'top' || isPagesSidebarHidden },
            { 'overflow-x-hidden': moduleId !== 'canvas' } // Disbling horizontal scroll for modules in view mode
          )}
          style={canvasContainerStyles}
        >
          {appType !== 'module' && (
            <PagesSidebarNavigation
              showHeader={showHeader}
              isMobileDevice={currentLayout === 'mobile'}
              currentPageId={currentPageId ?? homePageId}
              switchPage={switchPage}
              height={currentMode === 'edit' ? canvasContainerHeight : '100%'}
              switchDarkMode={switchDarkMode}
              isSidebarPinned={isViewerSidebarPinned}
              setIsSidebarPinned={setIsSidebarPinned}
              darkMode={darkMode}
              canvasMaxWidth={canvasMaxWidth}
              canvasContentRef={canvasContentRef}
            />
          )}
          <div
            ref={canvasContentRef}
            style={{
              minWidth: minCanvasWidth,
              overflow: currentMode === 'view' ? 'auto' : 'hidden auto',
              width: currentMode === 'view' ? `calc(100% - ${isViewerSidebarPinned ? '0px' : '0px'})` : '100%',
              ...(appType === 'module' && isModuleMode && { height: 'inherit' }),
            }}
            className={cx(`app-${appId} _tooljet-page-${getPageId()} canvas-content`, {
              'scrollbar-hidden': !isScrolling,
            })}
          >
            {currentMode === 'edit' && (
              <AutoComputeMobileLayoutAlert currentLayout={currentLayout} darkMode={isAppDarkMode} />
            )}
            <DeleteWidgetConfirmation darkMode={isAppDarkMode} />
            <HotkeyProvider
              mode={currentMode}
              canvasMaxWidth={canvasMaxWidth}
              currentLayout={currentLayout}
              isModuleMode={isModuleMode}
            >
              {environmentLoadingState !== 'loading' && (
                <div className={cx({ 'h-100': isModuleMode })}>
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
                  {currentMode === 'edit' && (
                    <>
                      <DragResizeGhostWidget />
                    </>
                  )}
                  <div id="component-portal" />
                  {appType !== 'module' && <div id="component-portal" />}
                </div>
              )}

              {currentMode === 'view' || (currentLayout === 'mobile' && isAutoMobileLayout) ? null : (
                <Suspense fallback="Loading...">
                  <Grid currentLayout={currentLayout} gridWidth={gridWidth} mainCanvasWidth={canvasWidth} />
                </Suspense>
              )}
            </HotkeyProvider>
          </div>
        </div>
      </div>
      {currentMode === 'edit' && (
        <Suspense fallback="Loading...">
          <EditorSelecto />
        </Suspense>
      )}
    </div>
  );
};
