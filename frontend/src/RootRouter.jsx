import React, { Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';

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
 * ChunkErrorBoundary — Renders a recovery screen for any crash in the app tree, and additionally
 * auto-reloads once for ChunkLoadError from stale webpack chunks after deployments.
 *
 * After a new deployment, old chunk files no longer exist on the
 * server. If the browser still has a cached index.html referencing old filenames, lazy-loaded
 * imports will fail with ChunkLoadError.
 *
 * ChunkLoadError recovery strategy:
 *  1. On first ChunkLoadError → auto-reload once (picks up new index.html with correct chunk names)
 *  2. If the reload didn't help (flag still set) → show a user-facing error with a manual Refresh button
 *  3. On successful app boot → flags are cleared (in index.jsx) so future deployments can auto-recover
 *
 * The `chunk_reload` flag in sessionStorage prevents infinite reload loops.
 */
class ChunkErrorBoundary extends Component {
  state = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error) {
    // Every error must flip hasError. Returning null here leaves the boundary rendering the
    // same crashing children, which remount and throw again — a silent infinite remount that
    // pegs the CPU and exhausts the browser's connection pool instead of showing anything.
    return { hasError: true, isChunkError: error?.name === 'ChunkLoadError' };
  }

  componentDidCatch(error, errorInfo) {
    if (error?.name === 'ChunkLoadError') {
      if (!sessionStorage.getItem('chunk_reload')) {
        // First failure — attempt one automatic reload to pick up new chunks
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload();
      }
      // If chunk_reload flag is already set, we've already tried reloading once.
      // Don't reload again — render() will show the error UI instead.
      return;
    }
    // React reports boundary-caught errors to this hook and nowhere else, so without
    // this a render crash leaves no trace in the console or in error reporting.
    console.error('[ChunkErrorBoundary] Uncaught render error:', error, errorInfo?.componentStack);
    Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
  }

  handleRefresh = () => {
    // Clear the flag so the reload gets a fresh attempt
    sessionStorage.removeItem('chunk_reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Chunk errors: reload was already attempted once and didn't fix it.
      // Anything else: a real crash we cannot recover from automatically.
      const message = this.state.isChunkError
        ? 'A new version is available. Please refresh to continue.'
        : 'Something went wrong. Please refresh to continue.';
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
          <p style={{ fontSize: '16px', color: '#666' }}>{message}</p>
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
            {/* App-scoped auth routes (login/signup) are lazy-loaded inside ViewerApp */}
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
