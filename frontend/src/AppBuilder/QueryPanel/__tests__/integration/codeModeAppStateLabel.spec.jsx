/**
 * DB-M01: in Code mode the state inspector is called "App state", as main's rail called it; visual
 * apps keep "Inspector". The bottom tab, its open/close toggle and the drawer's close button agree.
 */
import React from 'react';
import { act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { QueryPanel } from '@/AppBuilder/QueryPanel/QueryPanel';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const tab = () => document.querySelector('[data-cy="runtime-panel-tab-inspect"]');
const toggle = () => document.querySelector('[data-cy="query-manager-toggle-button"]');

const setup = (buildMode) => {
  controls.observers.install();
  localStorage.removeItem('runtimePanelPreferences');
  seedApp({});
  act(() => {
    useStore.getState().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1', buildMode });
    useStore.getState().queryPanel.setRuntimePanelTab('inspect');
    useStore.getState().queryPanel.setIsQueryPaneExpanded(true);
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <QueryPanel darkMode={false} />
    </ModuleProvider>
  );
};

afterEach(() => controls.restore());

// Break this catches: Code mode's App state reads "Inspector" again.
test('a Code mode app calls the Inspector "App state"', () => {
  setup('code');

  expect(tab()).toHaveTextContent('App state');
  expect(toggle()).toHaveAccessibleName('Close app state');
  expect(document.querySelector('[data-cy="runtime-inspector-close-button"]')).toHaveAccessibleName('Close app state');
});

test('a visual app keeps "Inspector"', () => {
  setup('visual');

  expect(tab()).toHaveTextContent('Inspector');
  expect(toggle()).toHaveAccessibleName('Close inspector');
});
