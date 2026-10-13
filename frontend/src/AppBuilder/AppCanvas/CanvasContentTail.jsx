import React from 'react';

import { SuspenseLoadingOverlay } from './SuspenseTracker';

export const CanvasContentTail = ({ currentMode, appType, isAppDarkMode, pageLoader = false, children }) => (
  // COMMON DESKTOP AND MOBILE LAYOUT COMPONENT
  <>
    {currentMode === 'view' && appType !== 'module' && (
      <SuspenseLoadingOverlay darkMode={isAppDarkMode} pageLoader={pageLoader} />
    )}
    {children}
    {appType !== 'module' && <div id="component-portal" />}
  </>
);
