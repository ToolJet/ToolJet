import React from 'react';
import { createRoot } from 'react-dom/client';

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
import { captureMcpOAuthBootstrap } from './McpOAuth/bootstrap';

// OAuth bootstrap fragments are credentials. Remove them before config,
// analytics, error reporting, or the router can capture the page URL.
captureMcpOAuthBootstrap();

// When on a custom domain, use relative API path so requests go through the
// Cloudflare Worker proxy, making cookies first-party (fixes incognito sign-in).
// Compare hostnames (not origins) so local dev with different ports is unaffected.
try {
  const apiHostname = new URL(config.apiUrl, window.location.origin).hostname;
  if (apiHostname !== window.location.hostname) {
    const apiPath = new URL(config.apiUrl, window.location.origin).pathname.replace(/\/$/, '');
    config.apiUrl = apiPath || '/api';
  }
} catch {
  // apiUrl is already relative — no override needed
}

const AppWithProfiler = Sentry.withProfiler(RootRouter);

// The website (a different site) cannot set cookies for this app, so it passes the template id
// or build prompt in the URL: ?tj_template_id=... / ?tj_ai_prompt=... on a direct redirect, or
// inside the OAuth state on SSO. Set them as first-party cookies before any route mounts, so the
// session payload carries them through login and HomePage deploys the template / builds the app.
// Cookies are capped at ~4KB and the server URL-encodes the value, so cap the encoded length.
const MAX_ENCODED_PROMPT_LENGTH = 3500;
const AI_COOKIE_VALIDATORS = {
  tj_template_id: (value) => /^[a-z0-9-]{1,100}$/.test(value),
  tj_ai_prompt: (value) => value.trim() !== '' && encodeURIComponent(value).length <= MAX_ENCODED_PROMPT_LENGTH,
};

const readAiCookiesFromUrl = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const state = hash.get('state') || query.get('state');
  const stateParams = state ? new URLSearchParams(state) : null;

  const found = {};
  Object.entries(AI_COOKIE_VALIDATORS).forEach(([key, isValid]) => {
    const value = query.get(key) || hash.get(key) || stateParams?.get(key);
    if (value && isValid(value)) found[key] = value;
  });
  return found;
};

const persistAiCookiesFromUrl = async () => {
  const cookies = readAiCookiesFromUrl();
  if (Object.keys(cookies).length === 0) return;

  // Drop the params so a reload does not deploy / build a second time
  const url = new URL(window.location.href);
  const strippedKeys = Object.keys(AI_COOKIE_VALIDATORS).filter((key) => url.searchParams.has(key));
  if (strippedKeys.length > 0) {
    strippedKeys.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(window.history.state, '', url);
  }

  try {
    await aiOnboardingService.setAiCookie(cookies);
  } catch (error) {
    console.error('Failed to set AI onboarding cookie:', error);
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
  .then(persistAiCookiesFromUrl)
  .then(() => {
    createRoot(document.getElementById('app')).render(<AppWithProfiler />);

    // App booted successfully — clear the .catch() below's reload flag so a later boot failure can
    // auto-reload again. The chunk reload guard (chunkReloadGuard.ts) is time-based and isn't cleared
    // here: route chunks load after boot, so clearing it would let a failing chunk reload forever.
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
