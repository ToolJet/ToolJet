/**
 * Both React Builder (Code mode) and visual apps call the bottom state drawer "Inspector"
 * (supersedes DB-M01). The bottom tab, its open/close toggle, and the drawer's close button agree.
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

// Break this catches: Code mode reverts to calling the Inspector "App state".
test.each(['code', 'visual'])('a %s app calls the bottom state drawer "Inspector"', (buildMode) => {
  setup(buildMode);

  expect(tab()).toHaveTextContent('Inspector');
  expect(toggle()).toHaveAccessibleName('Close inspector');
  expect(document.querySelector('[data-cy="runtime-inspector-close-button"]')).toHaveAccessibleName('Close inspector');
});
