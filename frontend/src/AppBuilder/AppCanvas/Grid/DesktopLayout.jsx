import React from 'react';
import cx from 'classnames';

import { PAGE_CANVAS_HEADER_HEIGHT } from '../appCanvasConstants';
import { PageCanvasHeader } from './PageCanvasHeader';
import { PageCanvasFooter } from './PageCanvasFooter';
import PagesSidebarNavigation from '../PageMenu/PagesSidebarNavigation';
import { CanvasContentTail } from './CanvasContentTail';

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
}) => (
  <div
    key={pageKey}
    className={cx({ 'h-100': isModuleMode })}
    style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
  >
    <PageCanvasHeader showCanvasHeader={showCanvasHeader} isMobileLayout={isMobileLayout} currentMode={currentMode} />
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
              top: showCanvasHeader && appType !== 'module' ? PAGE_CANVAS_HEADER_HEIGHT : 0,
              flexShrink: 0,
              zIndex: 5,
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
      <CanvasContentTail currentMode={currentMode} appType={appType} isAppDarkMode={isAppDarkMode}>
        {mainCanvasContainer}
      </CanvasContentTail>
    </div>
    <PageCanvasFooter showCanvasFooter={showCanvasFooter} isMobileLayout={isMobileLayout} currentMode={currentMode} />
  </div>
);
