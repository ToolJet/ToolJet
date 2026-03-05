import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { shallow } from 'zustand/shallow';
import './appCanvas.scss';

import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { HotkeyProvider } from './HotkeyProvider';
import useStore from '@/AppBuilder/_stores/store';
import { computeViewerBackgroundColor, getCanvasWidth } from './appCanvasUtils';
import { NO_OF_GRIDS, CONTAINER_FORM_CANVAS_PADDING } from './appCanvasConstants';

// TODO: Move these to page settings / global settings when ready
const CANVAS_HEADER_HEIGHT = 80;
import cx from 'classnames';
import { computeCanvasContainerHeight } from '../_helpers/editorHelpers';
import AutoComputeMobileLayoutAlert from './AutoComputeMobileLayoutAlert';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import useAppCanvasMaxWidth from './Hooks/useAppCanvasMaxWidth';
import { DeleteWidgetConfirmation } from './DeleteWidgetConfirmation';
import useSidebarMargin from './Hooks/useSidebarMargin';
import useAppPageSidebarHeight from './Hooks/useAppPageSidebarHeight';
import PagesSidebarNavigation from '../RightSideBar/PageSettingsTab/PageMenu/PagesSidebarNavigation';
import MobileNavigationHeader from '../RightSideBar/PageSettingsTab/PageMenu/MobileNavigationHeader';
import { DragResizeGhostWidget } from './GhostWidgets';

import { Container } from './Container';
import { SuspenseCountProvider, SuspenseLoadingOverlay } from './SuspenseTracker';

// Lazy load editor-only component to reduce viewer bundle size
const AppCanvasBanner = lazy(() => import('@/AppBuilder/Header/AppCanvasBanner'));
const EditorSelecto = React.lazy(() => import('./Selecto'));
const Grid = React.lazy(() => import('./Grid'));
import useCanvasMinWidth from './Hooks/useCanvasMinWidth';
import useEnableMainCanvasScroll from './Hooks/useEnableMainCanvasScroll';
import useCanvasResizing from './Hooks/useCanvasResizing';

export const AppCanvas = ({ appId, switchDarkMode, darkMode }) => {
  const { moduleId, isModuleMode, appType } = useModuleContext();
  const canvasContainerRef = useRef();
  const canvasContentRef = useRef(null);
  const sideBarVisibleHeight = useAppPageSidebarHeight(canvasContentRef);

  useEnableMainCanvasScroll({ canvasContentRef });
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
  const canvasMaxWidth = useAppCanvasMaxWidth();
  const editorMarginLeft = useSidebarMargin(canvasContainerRef);
  const getPageId = useStore((state) => state.getCurrentPageId, shallow);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const pageKey = useStore((state) => state.pageKey);
  const selectedVersion = useStore((state) => state.selectedVersion, shallow);
  const isMobilePreviewMode = selectedVersion?.id && currentLayout === 'mobile' && currentMode === 'view';
  const isMobileLayout = currentLayout === 'mobile';
  const [isViewerSidebarPinned, setIsSidebarPinned] = useState(
    localStorage.getItem('isPagesSidebarPinned') === null
      ? false
      : localStorage.getItem('isPagesSidebarPinned') !== 'false'
  );

  const { pageSettings } = useStore(
    (state) => ({
      pageSettings: state.pageSettings,
    }),
    shallow
  );
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const { position } = properties ?? {};
  const showCanvasHeader = useStore(
    (state) =>
      state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageHeader?.[
        currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'
      ] ?? false,
    shallow
  );

  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);
  const minCanvasWidth = useCanvasMinWidth({
    currentMode,
    isModuleMode,
  });
  const [isCurrentVersionLocked, setIsCurrentVersionLocked] = useState(false);
  console.log('currentLayout', currentLayout, isMobileLayout, showCanvasHeader);

  // This is added to notify when all Suspense components have resolved
  // If everything is ready, we set the isComponentLayoutReady to true which runs the onLoadQueries
  const handleAllSuspenseResolved = useCallback(() => {
    // Need to remove this if we shift setExposedVariable Logic outside of components
    // Currently present to run onLoadQueries after the component is mounted
    setIsComponentLayoutReady(true, moduleId);
  }, [setIsComponentLayoutReady, moduleId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => setIsComponentLayoutReady(false, moduleId);
  }, [moduleId, setIsComponentLayoutReady]);

  useCanvasResizing({
    setCanvasWidth,
    moduleId,
    currentLayout,
    canvasMaxWidth,
    isRightSidebarOpen,
    isViewerSidebarPinned,
    position,
    currentMode,
  });

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
      paddingTop: currentMode === 'edit' && (isCurrentVersionLocked ? '38px' : '8px'),
    };
  }, [
    currentMode,
    isAppDarkMode,
    isModuleMode,
    editorMarginLeft,
    canvasContainerHeight,
    isRightSidebarOpen,
    isCurrentVersionLocked,
  ]);

  // === Shared canvas header JSX (used in both mobile and desktop layouts) ===
  const _renderCanvasHeaderSlot = () => {
    if (!showCanvasHeader) return null;
    return (
      <div
        className={cx('canvas-header-slot', {
          '!tw-w-[450px] tw-mx-auto': isMobileLayout && (currentMode === 'edit' || isMobilePreviewMode),
        })}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
          padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
          height: `${CANVAS_HEADER_HEIGHT}px`,
          borderBottom: '1px solid var(--cc-default-border)',
          backgroundColor: isAppDarkMode ? '#232E3C' : '#fff',
          width: '100%',
        }}
      >
        <Container
          id={`${moduleId}-header`}
          canvasHeight={CANVAS_HEADER_HEIGHT / 10}
          canvasWidth={window.innerWidth}
          darkMode={isAppDarkMode}
          allowContainerSelect={false}
          styles={{
            margin: 0,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
          componentType="AppCanvas"
          hasNoScroll={true}
        />
      </div>
    );
  };

  // === Shared main canvas Container JSX ===
  const mainCanvasContainer = (
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
  );

  // === MOBILE LAYOUT: header + nav + canvas, all inside scroll for Moveable alignment ===
  const _renderMobileLayout = () => (
    <div key={pageKey} style={{ position: 'relative' }} className={cx('!tw-w-[450px] tw-mx-auto')}>
      {/* Canvas header — sticky at top of scroll */}
      {_renderCanvasHeaderSlot()}
      {/* Mobile nav — sticky below header */}
      {appType !== 'module' && (
        <div style={{ position: 'sticky', top: showCanvasHeader ? CANVAS_HEADER_HEIGHT : 0, zIndex: 9, flexShrink: 0 }}>
          <MobileNavigationHeader
            isMobileDevice={true}
            currentPageId={currentPageId ?? homePageId}
            switchDarkMode={switchDarkMode}
            darkMode={darkMode}
            canvasMaxWidth={canvasMaxWidth}
          />
        </div>
      )}
      {currentMode === 'view' && appType !== 'module' && <SuspenseLoadingOverlay darkMode={isAppDarkMode} />}
      {mainCanvasContainer}
      {currentMode === 'edit' && <DragResizeGhostWidget />}
      <div id="component-portal" />
      {appType !== 'module' && <div id="component-portal" />}
    </div>
  );

  // === DESKTOP LAYOUT: flex-column with header + sidebar wrapper for Moveable alignment ===
  const _renderDesktopLayout = () => (
    <div
      key={pageKey}
      className={cx({ 'h-100': isModuleMode })}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {_renderCanvasHeaderSlot()}
      <div
        className={cx('canvas-wrapper tw-w-full tw-h-full d-flex', {
          'tw-flex-col': position === 'top' || isPagesSidebarHidden,
        })}
      >
        {appType !== 'module' && (
          <>
            {/* === SIDEBAR STICKY WRAPPER === */}
            <div
              style={{
                position: 'sticky',
                top: showCanvasHeader && appType !== 'module' ? CANVAS_HEADER_HEIGHT : 0,
                flexShrink: 0,
                zIndex: 5,
                height: `calc(${sideBarVisibleHeight} - ${
                  showCanvasHeader && appType !== 'module' ? CANVAS_HEADER_HEIGHT : 0
                }px)`,
              }}
            >
              <PagesSidebarNavigation
                isMobileDevice={isMobileLayout}
                currentPageId={currentPageId ?? homePageId}
                switchDarkMode={switchDarkMode}
                isSidebarPinned={isViewerSidebarPinned}
                setIsSidebarPinned={setIsSidebarPinned}
                darkMode={darkMode}
                canvasMaxWidth={canvasMaxWidth}
                canvasContentRef={canvasContentRef}
              />
            </div>
          </>
        )}
        {currentMode === 'view' && appType !== 'module' && <SuspenseLoadingOverlay darkMode={isAppDarkMode} />}
        {mainCanvasContainer}
      </div>
      {currentMode === 'edit' && <DragResizeGhostWidget />}
      <div id="component-portal" />
      {appType !== 'module' && <div id="component-portal" />}
    </div>
  );

  return (
    <div>
      <div
        className={cx(`main main-editor-canvas position-relative`, {})}
        id="main-editor-canvas"
        onMouseUp={handleCanvasContainerMouseUp}
      >
        <div id="sidebar-page-navigation" className="areas d-flex flex-rows">
          <div
            ref={canvasContainerRef}
            className={cx(
              'canvas-container page-container',
              { 'dark-theme theme-dark': isAppDarkMode, close: !isViewerSidebarPinned },
              { 'overflow-x-auto': currentMode === 'edit' },
              { 'overflow-x-hidden': moduleId !== 'canvas' } // Disbling horizontal scroll for modules in view mode
            )}
            style={canvasContainerStyles}
          >
            {currentMode === 'edit' && (
              <Suspense fallback={null}>
                <AppCanvasBanner
                  appId={appId}
                  onVersionLockStatusChange={(isLocked) => {
                    setIsCurrentVersionLocked(isLocked);
                  }}
                />
              </Suspense>
            )}
            {currentMode === 'edit' && (
              <AutoComputeMobileLayoutAlert
                currentLayout={currentLayout}
                darkMode={isAppDarkMode}
                isCurrentVersionLocked={isCurrentVersionLocked}
              />
            )}
            <div
              id="app-canvas-container"
              className={cx('tw-h-full tw-flex tw-flex-col tw-relative', {
                '!tw-w-[450px] tw-mx-auto': isMobileLayout,
              })}
              style={{ minWidth: minCanvasWidth }}
            >
              <div
                ref={canvasContentRef}
                className={cx(
                  `app-${appId} _tooljet-page-${getPageId()} canvas-content`,
                  isMobileLayout && 'canvas-wrapper',
                  isMobileLayout && 'tw-relative tw-overflow-x-hidden'
                )}
                style={{
                  overflow: currentMode === 'view' ? 'auto' : 'hidden auto',
                  width: '100%',
                  flex: 1,
                  minHeight: 0,
                  ...(!isMobileLayout && appType === 'module' && isModuleMode ? { height: 'inherit' } : {}),
                }}
              >
                <DeleteWidgetConfirmation darkMode={isAppDarkMode} />
                <HotkeyProvider
                  mode={currentMode}
                  canvasMaxWidth={canvasMaxWidth}
                  currentLayout={currentLayout}
                  isModuleMode={isModuleMode}
                >
                  {environmentLoadingState !== 'loading' && (
                    <SuspenseCountProvider
                      onAllResolved={handleAllSuspenseResolved}
                      deferCheck={isModuleMode || appType === 'module'}
                    >
                      {isMobileLayout ? _renderMobileLayout() : _renderDesktopLayout()}
                    </SuspenseCountProvider>
                  )}

                  {currentMode === 'view' || (isMobileLayout && isAutoMobileLayout) ? null : (
                    <Suspense fallback={null}>
                      <Grid currentLayout={currentLayout} gridWidth={gridWidth} mainCanvasWidth={canvasWidth} />
                    </Suspense>
                  )}
                </HotkeyProvider>
              </div>
            </div>
          </div>
        </div>
        {currentMode === 'edit' && (
          <Suspense fallback={null}>
            <EditorSelecto />
          </Suspense>
        )}
      </div>
    </div>
  );
};
