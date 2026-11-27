/**
 * The Inspector's detail pane shows the selected node only while that node still exists. After the
 * component is deleted (or the user switches to a page without it) the pane goes back to its empty
 * state instead of keeping "id undefined" with Go to component / Delete actions that throw.
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import RuntimeInspector from '@/AppBuilder/QueryPanel/RuntimeInspector/RuntimeInspector';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();
const detail = () => screen.getByRole('region', { name: 'Selected value' });
const EMPTY_STATE = 'Select an item to inspect its values';

beforeEach(() => {
  controls.observers.install();
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <RuntimeInspector darkMode={false} moduleId="canvas" appType="front-end" onClose={() => {}} />
    </ModuleProvider>
  );
});

afterEach(() => {
  act(() => state().setSelectedNodePath(null));
  controls.restore();
});

test('shows the selected component while it exists', () => {
  act(() => state().setSelectedNodePath('components.button1'));

  expect(detail()).not.toHaveTextContent(EMPTY_STATE);
  expect(detail()).toHaveTextContent('button1');
});

test('goes back to the empty state when the selected component no longer exists', () => {
  act(() => state().setSelectedNodePath('components.deletedButton'));

  expect(detail()).toHaveTextContent(EMPTY_STATE);
  expect(detail()).not.toHaveTextContent('deletedButton');
});
