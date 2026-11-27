/**
 * React Builder (Code mode) apps manage UI state in React and route via useNavigation(), so
 * ToolJet's app-level Variables and Page categories do not apply in the Inspector tree (nor does
 * an empty Components section). Queries, Globals, and Constants remain; visual apps keep all categories.
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import RuntimeInspector from '@/AppBuilder/QueryPanel/RuntimeInspector/RuntimeInspector';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const header = (id) => document.querySelector(`[data-cy="inspector-${id}-expand-button"]`);

const setup = (buildMode) => {
  controls.observers.install();
  seedApp({});
  act(() => {
    useStore.getState().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1', buildMode });
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <RuntimeInspector darkMode={false} moduleId="canvas" appType="front-end" onClose={() => {}} />
    </ModuleProvider>
  );
};

afterEach(() => controls.restore());

// Break this catches: Variables and Page still appear in Code mode's Inspector tree and filters.
test('a React Builder (Code mode) app hides Variables, Page, and empty Components, keeping Queries, Globals, and Constants', () => {
  setup('code');

  expect(header('variables')).toBeNull();
  expect(header('page')).toBeNull();
  expect(header('components')).toBeNull();

  expect(header('queries')).toBeInTheDocument();
  expect(header('globals')).toBeInTheDocument();
  expect(header('constants')).toBeInTheDocument();

  expect(screen.getAllByRole('tab').map((el) => el.textContent)).toEqual(['All', 'Queries', 'Globals', 'Constants']);
});

// Break this catches: the Code mode filter hides Variables, Page, or Components from visual apps.
test('a visual app keeps Variables, Page, and Components', () => {
  setup('visual');

  expect(header('variables')).toBeInTheDocument();
  expect(header('page')).toBeInTheDocument();
  expect(header('components')).toBeInTheDocument();
});
