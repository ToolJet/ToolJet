import React, { Suspense, lazy } from 'react';
import cx from 'classnames';

import { PAGE_CANVAS_HEADER_HEIGHT } from './appCanvasConstants';
import PagesSidebarNavigation from './PageMenu/PagesSidebarNavigation';
import { CanvasContentTail } from './CanvasContentTail';

const PageCanvasHeader = lazy(() => import('./PageCanvasHeader'));
const PageCanvasFooter = lazy(() => import('./PageCanvasFooter'));

export const DesktopLayout = ({
  pageKey,
  isModuleMode,
  isMobileLayout,
  showCanvasHeader,
  showCanvasFooter,
  position,
  isPagesSidebarHidden,
  appType,
  sideBarVisibleHeight,
  currentPageId,
  homePageId,
  switchDarkMode,
  isViewerSidebarPinned,
  setIsSidebarPinned,
  darkMode,
  canvasMaxWidth,
  canvasContentRef,
  currentMode,
  isAppDarkMode,
  mainCanvasContainer,
  gridContent,
  canvasHeaderHeight = PAGE_CANVAS_HEADER_HEIGHT,
  pageLoader = false,
}) => (
  <div
    key={pageKey}
    className={cx('tj-canvas-area', { 'h-100': isModuleMode })}
    style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      transform: 'translateZ(0)',
    }}
  >
    <Suspense fallback={null}>
      <PageCanvasHeader showCanvasHeader={showCanvasHeader} isMobileLayout={isMobileLayout} currentMode={currentMode} />
    </Suspense>
    <div
      className={cx('canvas-wrapper  tw-w-full tw-h-full d-flex', {
        'tw-flex-col': position === 'top' || isPagesSidebarHidden,
      })}
    >
      {appType !== 'module' && (
        <>
          {/* === SIDEBAR STICKY WRAPPER === */}
          <div
            style={{
              position: 'sticky',
              top: showCanvasHeader && appType !== 'module' ? canvasHeaderHeight : 0,
              flexShrink: 0,
              zIndex: 15,
              height: sideBarVisibleHeight,
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
      <CanvasContentTail
        currentMode={currentMode}
        appType={appType}
        isAppDarkMode={isAppDarkMode}
        pageLoader={pageLoader}
      >
        {mainCanvasContainer}
      </CanvasContentTail>
    </div>
    <Suspense fallback={null}>
      <PageCanvasFooter showCanvasFooter={showCanvasFooter} isMobileLayout={isMobileLayout} currentMode={currentMode} />
    </Suspense>
    {gridContent}
  </div>
);
