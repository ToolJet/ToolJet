import React from 'react';

import { DragResizeGhostWidget } from './GhostWidgets';
import { SuspenseLoadingOverlay } from './SuspenseTracker';

export const CanvasContentTail = ({ currentMode, appType, isAppDarkMode, children }) => (
  // COMMON DESKTOP AND MOBILE LAYOUT COMPONENT
  <>
    {currentMode === 'view' && appType !== 'module' && <SuspenseLoadingOverlay darkMode={isAppDarkMode} />}
    {children}
    {currentMode === 'edit' && <DragResizeGhostWidget />}
    <div id="component-portal" />
    {appType !== 'module' && <div id="component-portal" />}
  </>
);
