import React, { Suspense, useRef, lazy } from 'react';
import cx from 'classnames';

import { CANVAS_WIDTHS, PAGE_CANVAS_HEADER_HEIGHT } from './appCanvasConstants';
import MobileNavigationHeader from './PageMenu/MobileNavigationHeader';
import { CanvasContentTail } from './CanvasContentTail';

const PageCanvasHeader = lazy(() => import('./PageCanvasHeader'));
const PageCanvasFooter = lazy(() => import('./PageCanvasFooter'));

export const MobileLayout = ({
  pageKey,
  //   mobileCanvasFrameRef,
  //   mobileNavSheetContainerRef,
  showCanvasHeader,
  showCanvasFooter,
  isMobileLayout,
  currentMode,
  appType,
  currentPageId,
  homePageId,
  switchDarkMode,
  darkMode,
  canvasMaxWidth,
  isAppDarkMode,
  mainCanvasContainer,
  gridContent,
  canvasHeaderHeight = PAGE_CANVAS_HEADER_HEIGHT,
  pageLoader = false,
}) => {
  const mobileCanvasFrameRef = useRef(null);
  const mobileNavSheetContainerRef = useRef(null);
  return (
    <div
      key={pageKey}
      ref={mobileCanvasFrameRef}
      data-cy="mobile-canvas-frame"
      style={{
        position: 'relative',
        transform: 'translateZ(0)',
        maxWidth: CANVAS_WIDTHS.deviceWindowWidth,
      }}
      className={cx('tj-canvas-area tw-w-full tw-mx-auto')}
    >
      <div
        ref={mobileNavSheetContainerRef}
        data-cy="mobile-nav-sheet-container"
        className={cx('tw-absolute tw-inset-0 tw-overflow-hidden tw-pointer-events-none')}
      />
      {/* Canvas header — sticky at top of scroll */}
      <Suspense fallback={null}>
        <PageCanvasHeader
          showCanvasHeader={showCanvasHeader}
          isMobileLayout={isMobileLayout}
          currentMode={currentMode}
        />
      </Suspense>
      {/* Mobile nav — sticky below header */}
      {appType !== 'module' && (
        <div
          style={{
            position: 'sticky',
            top: showCanvasHeader ? canvasHeaderHeight : 0,
            zIndex: 9,
            flexShrink: 0,
          }}
        >
          <MobileNavigationHeader
            isMobileDevice={true}
            currentPageId={currentPageId ?? homePageId}
            switchDarkMode={switchDarkMode}
            darkMode={darkMode}
            canvasMaxWidth={canvasMaxWidth}
            canvasContainerRef={mobileNavSheetContainerRef}
          />
        </div>
      )}
      <CanvasContentTail
        currentMode={currentMode}
        appType={appType}
        isAppDarkMode={isAppDarkMode}
        pageLoader={pageLoader}
      >
        {mainCanvasContainer}
      </CanvasContentTail>
      <Suspense fallback={null}>
        <PageCanvasFooter
          showCanvasFooter={showCanvasFooter}
          isMobileLayout={isMobileLayout}
          currentMode={currentMode}
        />
      </Suspense>
      {gridContent}
    </div>
  );
};
