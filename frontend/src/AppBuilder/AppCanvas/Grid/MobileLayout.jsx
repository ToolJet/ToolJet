import React, { useRef } from 'react';
import cx from 'classnames';

import { PAGE_CANVAS_HEADER_HEIGHT } from '../appCanvasConstants';
import { PageCanvasHeader } from './PageCanvasHeader';
import { PageCanvasFooter } from './PageCanvasFooter';
import MobileNavigationHeader from '../PageMenu/MobileNavigationHeader';
import { CanvasContentTail } from './CanvasContentTail';

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
}) => {
  const mobileCanvasFrameRef = useRef(null);
  const mobileNavSheetContainerRef = useRef(null);
  return (
    <div
      key={pageKey}
      ref={mobileCanvasFrameRef}
      data-cy="mobile-canvas-frame"
      style={{ position: 'relative' }}
      className={cx('!tw-w-[450px] tw-mx-auto')}
    >
      <div
        ref={mobileNavSheetContainerRef}
        data-cy="mobile-nav-sheet-container"
        className={cx('tw-absolute tw-inset-0 tw-overflow-hidden tw-pointer-events-none')}
      />
      {/* Canvas header — sticky at top of scroll */}
      <PageCanvasHeader showCanvasHeader={showCanvasHeader} isMobileLayout={isMobileLayout} currentMode={currentMode} />
      {/* Mobile nav — sticky below header */}
      {appType !== 'module' && (
        <div
          style={{
            position: 'sticky',
            top: showCanvasHeader ? PAGE_CANVAS_HEADER_HEIGHT : 0,
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
      <CanvasContentTail currentMode={currentMode} appType={appType} isAppDarkMode={isAppDarkMode}>
        {mainCanvasContainer}
      </CanvasContentTail>
      <PageCanvasFooter showCanvasFooter={showCanvasFooter} isMobileLayout={isMobileLayout} currentMode={currentMode} />
    </div>
  );
};
