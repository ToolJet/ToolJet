import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load ENTIRE APP ROUTERS (not just pages)
// This is CRITICAL for bundle isolation - each router imports completely different code
const ViewerApp = lazy(() => import('./ViewerApp'));
const MainApp = lazy(() => import('./App').then(module => ({ default: module.App })));

const LoadingFallback = () => (
  <div class="load" style={{ display: 'flex' }}>
    <div class="one"></div>
    <div class="two"></div>
    <div class="three"></div>
  </div>
);

/**
 * RootRouter - Root-level route splitter
 *
 * CRITICAL: This component splits routes at the ROOT level to achieve bundle isolation.
 *
 * How it works:
 * - /applications/* routes load ViewerApp.jsx (viewer bundle ONLY)
 * - /embed-apps/* routes load ViewerApp.jsx (viewer bundle ONLY)
 * - All other routes load App.jsx (main app bundle)
 *
 * Why this matters:
 * - Webpack creates separate bundles because the code paths never intersect at import time
 * - ViewerApp.jsx ONLY imports viewer-related code (no Dashboard, Settings, Database, Editor)
 * - App.jsx ONLY imports main app code (no Viewer)
 * - Result: Viewer bundle < 1.5MB (90% reduction from ~15MB)
 *
 * WARNING: Do NOT import feature components directly in this file!
 * Only lazy load the two top-level router components (ViewerApp and MainApp).
 */
export const RootRouter = () => {
  return (
    <BrowserRouter basename={window.public_config?.SUB_PATH || '/'}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Viewer routes - ISOLATED BUNDLE */}
          {/* These routes ONLY load ViewerApp.jsx which imports viewer code */}
          <Route path="/applications/*" element={<ViewerApp />} />
          <Route path="/embed-apps/*" element={<ViewerApp />} />

          {/* Everything else - SEPARATE BUNDLE */}
          {/* These routes load App.jsx which imports Dashboard, Settings, Database, Editor, etc. */}
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
