/**
 * A variable can be named anything (setVariable takes any string key). The Inspector must still show
 * its value and hand out a path that works inside {{ }}, e.g. variables["v space"].
 */
import React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import RuntimeInspector from '@/AppBuilder/QueryPanel/RuntimeInspector/RuntimeInspector';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();
const detail = () => screen.getByRole('region', { name: 'Selected value' });
const copied = () => navigator.clipboard.writeText.mock.calls.at(-1)[0];

beforeEach(() => {
  controls.observers.install();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn() } });
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  act(() => {
    state().setVariable('v space', 'spaced');
    state().setVariable('v-dash', 'dashed');
    state().setVariable('v.dot', 'dotted');
    state().setVariable('123num', 'numeric key');
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <RuntimeInspector darkMode={false} moduleId="canvas" appType="front-end" onClose={() => {}} />
    </ModuleProvider>
  );
});

afterEach(() => {
  act(() => state().setSelectedNodePath(null));
  controls.restore();
  delete navigator.clipboard;
});

test.each([
  ['v space', 'spaced', 'variables["v space"]'],
  ['v-dash', 'dashed', 'variables["v-dash"]'],
  ['v.dot', 'dotted', 'variables["v.dot"]'],
  ['123num', 'numeric key', 'variables["123num"]'],
])('shows the value of the variable named %j and copies a working path', (name, value, path) => {
  fireEvent.click(screen.getByRole('button', { name }));

  expect(detail()).toHaveTextContent(value);
  // One crumb per key: a dot inside the name must not split it.
  const crumbs = within(detail()).getByText(name, { selector: '.is-current' });
  expect(crumbs).toBeInTheDocument();

  fireEvent.click(within(detail()).getByRole('button', { name: 'Copy path' }));
  expect(copied()).toBe(path);

  fireEvent.click(within(detail()).getByRole('button', { name: 'Copy value' }));
  expect(JSON.parse(copied())).toBe(value);
});
