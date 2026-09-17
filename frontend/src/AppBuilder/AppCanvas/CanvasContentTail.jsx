import React from 'react';

import { DragResizeGhostWidget } from './GhostWidgets';
import { SuspenseLoadingOverlay } from './SuspenseTracker';

export const CanvasContentTail = ({ currentMode, appType, isAppDarkMode, pageLoader = false, children }) => (
  // COMMON DESKTOP AND MOBILE LAYOUT COMPONENT
  <>
    {currentMode === 'view' && appType !== 'module' && (
      <SuspenseLoadingOverlay darkMode={isAppDarkMode} pageLoader={pageLoader} />
    )}
    {children}
    {currentMode === 'edit' && <DragResizeGhostWidget />}
    {appType !== 'module' && <div id="component-portal" />}
  </>
);
