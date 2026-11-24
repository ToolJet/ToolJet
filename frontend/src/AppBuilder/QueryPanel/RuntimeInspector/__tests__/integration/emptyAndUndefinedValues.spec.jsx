/**
 * DB-11b: selecting a variable whose value is {}, [], a Date or undefined shows a readable value, the
 * one Copy value copies. The pane used to be blank for {}, [] and Date (no keys, so no rows) and to
 * show "" for undefined (the resolver turns undefined into "").
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import RuntimeInspector from '@/AppBuilder/QueryPanel/RuntimeInspector/RuntimeInspector';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();
const values = () => document.querySelector('.runtime-inspector__values');

beforeEach(() => {
  controls.observers.install();
  seedApp({});
  act(() => {
    state().setVariable('vObjEmpty', {});
    state().setVariable('vArrEmpty', []);
    state().setVariable('vDate', new Date('2026-01-01T00:00:00.000Z'));
    state().setVariable('vUndef', undefined);
    state().setVariable('vEmptyString', '');
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
});

// Break this catches: an empty object, empty array or Date opens a blank values pane.
test.each([
  ['vObjEmpty', '{}'],
  ['vArrEmpty', '[]'],
  ['vDate', '"2026-01-01T00:00:00.000Z"'],
  ['vEmptyString', '""'],
])('shows %s as %s', (name, shown) => {
  fireEvent.click(screen.getByRole('button', { name }));

  expect(values()).toHaveTextContent(shown);
});

// Break this catches: an undefined variable reads as an empty string.
test('shows an undefined variable as undefined', () => {
  fireEvent.click(screen.getByRole('button', { name: 'vUndef' }));

  expect(values()).toHaveTextContent('undefined');
  expect(values()).not.toHaveTextContent('""');
});
