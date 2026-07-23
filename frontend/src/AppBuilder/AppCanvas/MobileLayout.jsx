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
        // Edit mode: pin the frame to the canvas viewport and scroll only its canvas region (below the
        // sticky header) so the frame never rides up with the outer canvas.
        ...(currentMode === 'edit'
          ? { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
          : {}),
      }}
      className={cx('tj-canvas-area tw-w-full tw-mx-auto')}
    >
      <div
        ref={mobileNavSheetContainerRef}
        data-cy="mobile-nav-sheet-container"
        style={{ marginBottom: '-100dvh', zIndex: 1050 }}
        className={cx('tw-sticky tw-top-0 tw-inset-x-0 tw-h-dvh tw-overflow-hidden tw-pointer-events-none')}
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
        {currentMode === 'edit' ? (
          <div
            className="tj-mobile-canvas-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden auto',
              // Bottom gap lives in canvas height (updateCanvasBottomHeight); pad top/sides only to avoid doubling.
              padding: '16px 16px 0',
              boxSizing: 'border-box',
              backgroundColor: 'var(--surfaces-app-bg-default)',
            }}
          >
            {mainCanvasContainer}
          </div>
        ) : (
          mainCanvasContainer
        )}
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
