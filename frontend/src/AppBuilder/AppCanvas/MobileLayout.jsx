import React, { Suspense, useRef, lazy } from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';

import useStore from '@/AppBuilder/_stores/store';
import { CANVAS_WIDTHS, PAGE_CANVAS_HEADER_HEIGHT } from './appCanvasConstants';
import { computeViewerBackgroundColor } from './appCanvasUtils';
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

  // Mirrors Container.jsx's canvas background. Diverge from it and a seam appears around the canvas.
  const canvasBgColor = useStore((state) => state.getCanvasBackgroundColor('canvas', isAppDarkMode), shallow);
  const frameBgColor =
    currentMode === 'view' ? computeViewerBackgroundColor(isAppDarkMode, canvasBgColor) : canvasBgColor;

  return (
    <div
      key={pageKey}
      ref={mobileCanvasFrameRef}
      data-cy="mobile-canvas-frame"
      style={{
        position: 'relative',
        transform: 'translateZ(0)',
        maxWidth: CANVAS_WIDTHS.deviceWindowWidth,
        // Edit mode: pin the frame so only its canvas region scrolls, not the frame itself.
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
              // Containing block for Moveable's control boxes; drop it and resize handles drift by scrollTop.
              position: 'relative',
              // No gutter: stacked components carry their own side inset.
              boxSizing: 'border-box',
              backgroundColor: frameBgColor,
            }}
          >
            {mainCanvasContainer}
            {/* Must stay inside the scroll port: Moveable's control boxes detach from widgets otherwise. */}
            {gridContent}
          </div>
        ) : (
          // Matches the editor gutter so preview and the published app frame the canvas identically.
          <div style={{ boxSizing: 'border-box', backgroundColor: frameBgColor }}>{mainCanvasContainer}</div>
        )}
      </CanvasContentTail>
      <Suspense fallback={null}>
        <PageCanvasFooter
          showCanvasFooter={showCanvasFooter}
          isMobileLayout={isMobileLayout}
          currentMode={currentMode}
        />
      </Suspense>
      {currentMode !== 'edit' && gridContent}
    </div>
  );
};
