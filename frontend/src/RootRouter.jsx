import React, { Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load ENTIRE APP ROUTERS (not just pages)
// This is CRITICAL for bundle isolation - each router imports completely different code
const ViewerApp = lazy(() => import('./ViewerApp'));
const MainApp = lazy(() => import('./App').then((module) => ({ default: module.App })));

const LoadingFallback = () => (
  <div class="load" style={{ display: 'flex' }}>
    <div class="one"></div>
    <div class="two"></div>
    <div class="three"></div>
  </div>
);

/**
 * ChunkErrorBoundary — Catches ChunkLoadError from stale webpack chunks after deployments.
 *
 * After a new deployment, old chunk files no longer exist on the
 * server. If the browser still has a cached index.html referencing old filenames, lazy-loaded
 * imports will fail with ChunkLoadError.
 *
 * Recovery strategy:
 *  1. On first ChunkLoadError → auto-reload once (picks up new index.html with correct chunk names)
 *  2. If the reload didn't help (flag still set) → show a user-facing error with a manual Refresh button
 *  3. On successful app boot → flags are cleared (in index.jsx) so future deployments can auto-recover
 *
 * The `chunk_reload` flag in sessionStorage prevents infinite reload loops.
 */
class ChunkErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    if (error?.name === 'ChunkLoadError') {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error) {
    if (error?.name === 'ChunkLoadError' && !sessionStorage.getItem('chunk_reload')) {
      // First failure — attempt one automatic reload to pick up new chunks
      sessionStorage.setItem('chunk_reload', 'true');
      window.location.reload();
    }
    // If chunk_reload flag is already set, we've already tried reloading once.
    // Don't reload again — render() will show the error UI instead.
  }

  handleRefresh = () => {
    // Clear the flag so the reload gets a fresh attempt
    sessionStorage.removeItem('chunk_reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Reload already attempted once and didn't fix it — show error UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px',
          }}
        >
          <p style={{ fontSize: '16px', color: '#666' }}>A new version is available. Please refresh to continue.</p>
          <button
            onClick={this.handleRefresh}
            style={{
              padding: '8px 24px',
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: '#fff',
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <ChunkErrorBoundary>
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
      </ChunkErrorBoundary>
    </BrowserRouter>
  );
};
