import React from 'react';
import { render } from 'react-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { createBrowserHistory } from 'history';
import { appService } from '@/_services';
import { App } from './App';

appService.getConfig().then((config) => {
  window.public_config = config;

  if (window.public_config.APM_VENDOR == 'sentry') {
    const history = createBrowserHistory();
    Sentry.init({
      dsn: window.public_config.SENTRY_DNS,
      debug: !!window.public_config.SENTRY_DEBUG,
      integrations: [
        new Integrations.BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
        }),
      ],
      tracesSampleRate: 0.25
    });
  }
});

render(<App></App>, document.getElementById('app'));
