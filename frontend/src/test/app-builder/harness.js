import React, { StrictMode } from 'react';
import { act, cleanup as rtlCleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useStore from '@/AppBuilder/_stores/store';
import { render as renderWithRouter } from '@/test/test-utils';
import { createAppBuilderControls } from './controls';
import { createAppBuilderNetwork } from './network';

const sessions = (globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ ||= []);

export class AppBuilderTestSession {
  #controls;
  #network;
  #root;
  #hosts = [];
  #strictMode;
  #route;

  constructor({ scenario } = {}) {
    if (!scenario) throw new Error('AppBuilderTestSession requires a scenario');
    this.#controls = createAppBuilderControls();
    this.#network = createAppBuilderNetwork(scenario.capabilities.network);
    this.user = userEvent.setup();
    this.#strictMode = scenario.infrastructure?.strictMode === true;
    this.#route = {
      'app-editor': '/apps/test-app',
      'module-editor': '/modules/test-module',
      'authenticated-preview': '/applications/test-app',
      'released-viewer': '/applications/test-app',
      'embedded-viewer': '/applications/test-app/embed',
      'consumed-module': '/modules/test-module/view',
    }[scenario.surface];
    const capabilities = scenario.capabilities;
    if (capabilities.time) this.#controls.time.freeze(capabilities.time.at);
    if (capabilities.ids) this.#controls.ids.sequence(capabilities.ids.values);
    if (capabilities.observers) this.#controls.observers.install();
    if (capabilities.media) this.#controls.media.match(capabilities.media.matches);
    if (capabilities.storage?.clear) this.#controls.storage.clear();
    this.store = Object.freeze({
      act: async (action, ...args) => {
        await act(async () => {
          const state = useStore.getState();
          if (typeof action === 'string') {
            if (typeof state[action] !== 'function') throw new Error(`Unknown App Builder store action: ${action}`);
            await state[action](...args);
          } else {
            await action(state);
          }
        });
      },
      read: (selector) => selector(useStore.getState()),
    });
    sessions.push(async () => {
      this.#network.close();
      this.#controls.restore();
      rtlCleanup();
      this.#hosts.splice(0).forEach((host) => host.remove());
      this.#root = undefined;
    });
  }

  render(ui, options = {}) {
    const tree = this.#strictMode ? <StrictMode>{ui}</StrictMode> : ui;
    if (this.#root) {
      this.#root.rerender(tree);
      return this.#root;
    }
    for (const name of ['shared', 'component']) {
      const host = document.createElement('div');
      host.dataset.appBuilderPortal = name;
      document.body.appendChild(host);
      this.#hosts.push(host);
    }
    const { route: _ignoredRoute, ...safeOptions } = options;
    this.#root = renderWithRouter(tree, { ...safeOptions, route: this.#route });
    return this.#root;
  }
}
