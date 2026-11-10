/**
 * Cypress specs close the bottom panel through `[data-cy="query-manager-toggle-button"]`, and
 * `closeQueryPanel()` only clicks it when no `.query-pane` has the `collapsed` class. The runtime panel's
 * open/close toggle keeps both so those specs still work.
 */
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { QueryPanel } from '@/AppBuilder/QueryPanel/QueryPanel';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const toggle = () => document.querySelector('[data-cy="query-manager-toggle-button"]');
const isCollapsed = () =>
  Array.from(document.querySelectorAll('.query-pane')).some((el) => el.classList.contains('collapsed'));

beforeEach(() => {
  controls.observers.install();
  localStorage.removeItem('runtimePanelPreferences');
  act(() => useStore.getState().queryPanel.setIsQueryPaneExpanded(true));
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <QueryPanel darkMode={false} />
    </ModuleProvider>
  );
});

afterEach(() => controls.restore());

test('the open/close toggle carries the legacy query-manager-toggle-button hook', () => {
  expect(toggle()).toHaveClass('runtime-panel-toggle');
  expect(isCollapsed()).toBe(false);

  fireEvent.click(toggle());
  expect(useStore.getState().queryPanel.isQueryPaneExpanded).toBe(false);
  expect(isCollapsed()).toBe(true);

  fireEvent.click(toggle());
  expect(useStore.getState().queryPanel.isQueryPaneExpanded).toBe(true);
  expect(isCollapsed()).toBe(false);
});
