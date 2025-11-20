import React, { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppsRoute } from '@/Routes';
import { Viewer } from '@/AppBuilder/Viewer/Viewer.jsx';
import EmbedApp from '@/AppBuilder/EmbedApp';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import Toast from '@/_ui/Toast';
import '@/_styles/theme.scss';
import 'react-tooltip/dist/react-tooltip.css';
import { authorizeWorkspace, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { authenticationService, tooljetService } from '@/_services';
import { useAppDataStore } from '@/_stores/appDataStore';
import { setFaviconAndTitle } from '@white-label/whiteLabelling';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import hubspotHelper from '@/modules/common/helpers/hubspotHelper';

/**
 * ViewerApp - Isolated router for viewer routes ONLY
 *
 * CRITICAL: This file should ONLY import viewer-related code.
 * NO imports to Dashboard, Settings, Database, AppBuilder Editor, etc.
 *
 * Imported components:
 * - Viewer: Main viewer component
 * - EmbedApp: Embedded app viewer
 * - AppsRoute: Route wrapper for session management and app access validation
 *
 * This file includes necessary initialization logic:
 * - Workspace authorization
 * - Metadata fetching (version info, instance_id)
 * - Favicon and title setup
 * - Telemetry initialization (PostHog, HubSpot)
 *
 * This isolation ensures webpack creates a separate, lightweight bundle
 * for viewers that doesn't include the heavy editor/dashboard code.
 *
 * Target bundle size: < 1.5MB (vs ~15MB with all app code)
 */
const ViewerApp = () => {
  const { isAppDarkMode } = useAppDarkMode();
  const metadataFetchedRef = useRef(false);

  // Toast options for viewer
  const toastOptions = isAppDarkMode
    ? {
      className: 'toast-dark-mode',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        wordBreak: 'break-all',
      },
    }
    : {
      style: {
        wordBreak: 'break-all',
      },
    };

  // Simple dark mode switcher for viewer
  const switchDarkMode = (newMode) => {
    localStorage.setItem('darkMode', newMode);
  };

  // Fetch metadata (instance version, instance_id, etc.)
  const fetchMetadata = () => {
    tooljetService.fetchMetaData().then((data) => {
      updateCurrentSession({
        instance_id: data?.instance_id,
      });
      useAppDataStore.getState().actions.setMetadata(data);
      localStorage.setItem('currentVersion', data.installed_version);
    });
  };

  // Initialize telemetry and support tools
  const initTelemetryAndSupport = (currentUser) => {
    posthogHelper.initPosthog(currentUser);
  };

  // Initialization effect - runs once on mount
  useEffect(() => {
    // Prevent double initialization
    if (metadataFetchedRef.current) return;
    metadataFetchedRef.current = true;

    // Set favicon and title (white-label support)
    setFaviconAndTitle();

    // Authorize workspace session
    authorizeWorkspace();

    // Load HubSpot (analytics)
    hubspotHelper.loadHubspot();

    // Fetch instance metadata
    fetchMetadata();

    // Set up periodic metadata refresh (every hour)
    const metadataInterval = setInterval(fetchMetadata, 1000 * 60 * 60 * 1);

    // Initialize telemetry when user session is available
    let counter = 0;
    const telemetryInterval = setInterval(async () => {
      ++counter;
      const current_user = authenticationService.currentSessionValue?.current_user;
      if (current_user?.id) {
        initTelemetryAndSupport(current_user);
        clearInterval(telemetryInterval);
      } else if (counter > 10) {
        clearInterval(telemetryInterval);
      }
    }, 1000);

    // Cleanup intervals on unmount
    return () => {
      clearInterval(metadataInterval);
      clearInterval(telemetryInterval);
    };
  }, []);

  return (
    <>
      <div className="main-wrapper" data-cy="main-wrapper">
        <Routes>
          {/* Main viewer route: /applications/:slug/:pageHandle? */}
          <Route
            path="/:slug/:pageHandle?"
            element={
              <AppsRoute componentType="viewer">
                <Viewer switchDarkMode={switchDarkMode} darkMode={isAppDarkMode} />
              </AppsRoute>
            }
          />

          {/* Versioned viewer route with environment */}
          <Route
            path="/:slug/versions/:versionId/environments/:environmentId/:pageHandle?"
            element={
              <AppsRoute componentType="viewer">
                <Viewer switchDarkMode={switchDarkMode} darkMode={isAppDarkMode} />
              </AppsRoute>
            }
          />

          {/* Embedded app route: /embed-apps/:appId */}
          <Route path="/:appId" element={<EmbedApp />} />
        </Routes >
      </div >

      <Toast toastOptions={toastOptions} />
    </>
  );
};

export default ViewerApp;

const V = () => <>Hello</>
