/**
 * DB-34: the Inspector list answers arrow keys like the base tree did. Down/Up move focus to the
 * next/previous row (group headers and entries), Right expands the focused row, Left collapses it.
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
const press = (key) => fireEvent.keyDown(document.activeElement, { key });
const header = (id) => document.querySelector(`[data-cy="inspector-${id}-expand-button"]`);

beforeEach(() => {
  controls.observers.install();
  seedApp({});
  act(() => {
    state().setVariable('vNested', { a: 1 });
    state().setVariable('vPlain', 'text');
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

// Break this catches: arrow keys leave focus on the entry, the way the drawer's plain buttons did.
test('ArrowDown and ArrowUp move focus between rows', () => {
  const nested = screen.getByRole('button', { name: 'vNested' });
  const plain = screen.getByRole('button', { name: 'vPlain' });
  nested.focus();

  press('ArrowDown');
  expect(plain).toHaveFocus();

  press('ArrowUp');
  expect(nested).toHaveFocus();

  press('ArrowUp');
  expect(header('variables')).toHaveFocus();
});

// Break this catches: ArrowRight/ArrowLeft do not open or close the focused group.
test('ArrowLeft collapses a focused group and ArrowRight opens it again', () => {
  header('variables').focus();

  press('ArrowLeft');
  expect(header('variables')).toHaveAttribute('aria-expanded', 'false');

  press('ArrowRight');
  expect(header('variables')).toHaveAttribute('aria-expanded', 'true');
});
