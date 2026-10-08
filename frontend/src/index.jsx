import React from 'react';
import { render } from 'react-dom';

import * as Sentry from '@sentry/react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import { appService, aiOnboardingService } from '@/_services';
import { initFrontendMetrics } from '@/_services/frontend-metrics.service';
import { RootRouter } from './RootRouter';
// eslint-disable-next-line import/no-unresolved
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import config from 'config';

// When on a custom domain, use relative API path so requests go through the
// Cloudflare Worker proxy, making cookies first-party (fixes incognito sign-in).
// Compare hostnames (not origins) so local dev with different ports is unaffected.
try {
  const apiHostname = new URL(config.apiUrl, window.location.origin).hostname;
  if (apiHostname !== window.location.hostname) {
    config.apiUrl = '/api';
  }
} catch {
  // apiUrl is already relative — no override needed
}

const AppWithProfiler = Sentry.withProfiler(RootRouter);

// The website (a different site) cannot set cookies for this app, so it passes the template id
// in the URL: ?tj_template_id=... on a direct redirect, or inside the OAuth state on SSO.
// Set it as a first-party cookie before any route mounts, so the session payload carries it
// through login and HomePage deploys the template.
const TEMPLATE_ID_PARAM = 'tj_template_id';
const SET_COOKIE_TIMEOUT_MS = 5000;

const readTemplateIdFromUrl = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const state = hash.get('state') || query.get('state');
  return query.get(TEMPLATE_ID_PARAM) || (state && new URLSearchParams(state).get(TEMPLATE_ID_PARAM));
};

const persistTemplateIdFromUrl = async () => {
  const templateId = readTemplateIdFromUrl();
  if (!templateId || !/^[a-z0-9-]{1,100}$/.test(templateId)) return;

  // Boot waits for this call so the cookie exists before the first session request. The timeout keeps
  // a hung request from holding the render, so this visitor sees the app instead of the spinner forever.
  let timer;
  try {
    await Promise.race([
      aiOnboardingService.setAiCookie({ [TEMPLATE_ID_PARAM]: templateId }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('set-ai-cookie timed out')), SET_COOKIE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    // Keep the param in the URL: the id is the only copy, and a reload retries
    console.error('Failed to set template cookie:', error);
    return;
  } finally {
    clearTimeout(timer);
  }

  // Drop the param so a reload does not deploy the template a second time
  const url = new URL(window.location.href);
  if (url.searchParams.has(TEMPLATE_ID_PARAM)) {
    url.searchParams.delete(TEMPLATE_ID_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }
};

appService
  .getConfig()
  .then((config) => {
    console.log({ config });

    window.public_config = config;

    initFrontendMetrics();

    const language = config.LANGUAGE || 'en';
    const path = config?.SUB_PATH || '/';
    i18n
      .use(Backend)
      .use(initReactI18next)
      .init({
        load: 'languageOnly',
        fallbackLng: 'en',
        lng: language,
        backend: {
          loadPath: `${path}assets/translations/{{lng}}.json`,
        },
      });

    if (window.public_config.APM_VENDOR === 'sentry') {
      const tooljetServerUrl = window.public_config.TOOLJET_SERVER_URL;
      const tracingOrigins = ['localhost', /^\//];
      const releaseVersion = window.public_config.RELEASE_VERSION
        ? `tooljet-${window.public_config.RELEASE_VERSION}`
        : 'tooljet';

      if (tooljetServerUrl) tracingOrigins.push(tooljetServerUrl);

      Sentry.init({
        dsn: window.public_config.SENTRY_DNS,
        debug: !!window.public_config.SENTRY_DEBUG,
        release: releaseVersion,
        name: 'react',
        integrations: [
          new Sentry.BrowserTracing({
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              useLocation,
              useNavigationType,
              createRoutesFromChildren,
              matchRoutes
            ),
          }),
        ],
        tracesSampleRate: 0.5,
        tracePropagationTargets: tracingOrigins,
      });
    }
  })
  .then(persistTemplateIdFromUrl)
  .then(() => {
    render(<AppWithProfiler />, document.getElementById('app'));
    // .then(() => createRoot(document.getElementById('app')).render(<AppWithProfiler />));

    // App booted successfully — clear reload flags from both recovery mechanisms
    // (ChunkErrorBoundary in RootRouter.jsx and the .catch() below) so that
    // future deployments can trigger auto-reload again if needed.
    sessionStorage.removeItem('chunk_reload');
    sessionStorage.removeItem('boot_reload');
  })
  .catch((error) => {
    // If getConfig() or initialization fails (network error, auth redirect, stale response),
    // React never mounts and the page stays stuck on the HTML loading spinner forever.
    // Try one automatic reload to recover — the `boot_reload` flag prevents infinite loops.
    console.error('App failed to initialize:', error);
    if (!sessionStorage.getItem('boot_reload')) {
      sessionStorage.setItem('boot_reload', 'true');
      window.location.reload();
    }
    // If boot_reload flag is already set, we've already tried once.
    // Don't reload again — the issue is likely persistent (server down, etc.).
  });
