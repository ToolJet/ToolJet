import React, { StrictMode } from 'react';
import { act, cleanup as rtlCleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
  #dnd;

  constructor({ scenario } = {}) {
    if (!scenario) throw new Error('AppBuilderTestSession requires a scenario');
    this.#controls = createAppBuilderControls();
    this.#network = createAppBuilderNetwork(scenario.capabilities.network);
    this.user = userEvent.setup();
    this.#strictMode = scenario.infrastructure?.strictMode === true;
    // `capabilities.dnd` mounts the REAL react-dnd provider AppBuilder.jsx:96
    // supplies in production. `AppCanvas/Container` (and therefore any widget
    // rendered as a sub-container child, e.g. a Form field) throws
    // `Invariant Violation: Expected drag drop context` without it. Opt-in
    // because the backend attaches document-level listeners that specs not
    // rendering a container have no reason to pay for.
    this.#dnd = scenario.capabilities.dnd === true;
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
    const provided = this.#dnd ? <DndProvider backend={HTML5Backend}>{ui}</DndProvider> : ui;
    const tree = this.#strictMode ? <StrictMode>{provided}</StrictMode> : provided;
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
