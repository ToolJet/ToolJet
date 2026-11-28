/**
 * The right panel follows a query only when the user picks one (list click, new query, "View query").
 * A query the editor selects by itself (the next one after a delete, the first one on load or on a
 * version switch) must leave the right panel as the user had it: closed stays closed, and a component's
 * configuration is not replaced by the query editor.
 */
import React from 'react';
import { act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { QueryPanel } from '@/AppBuilder/QueryPanel/QueryPanel';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();

beforeEach(() => {
  controls.observers.install();
  localStorage.removeItem('runtimePanelPreferences');
  act(() => {
    state().dataQuery.setQueries(
      [
        { id: 'q1', name: 'runjs1', kind: 'runjs', options: {} },
        { id: 'q2', name: 'runjs2', kind: 'runjs', options: {} },
      ],
      'canvas'
    );
    state().queryPanel.setSelectedQuery(null);
    state().setActiveRightSideBarTab('configuration');
    state().setRightSidebarOpen(false);
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <QueryPanel darkMode={false} />
    </ModuleProvider>
  );
});

afterEach(() => controls.restore());

test('a query the user picks opens the right panel on that query', () => {
  act(() => state().queryPanel.setSelectedQuery('q1'));

  expect(state().isRightSidebarOpen).toBe(true);
  expect(state().activeRightSideBarTab).toBe('query');
});

test('a query the editor selects by itself leaves a closed right panel closed', () => {
  act(() => state().queryPanel.setSelectedQuery('q2', 'canvas', { reveal: false }));

  expect(state().queryPanel.selectedQuery?.id).toBe('q2');
  expect(state().isRightSidebarOpen).toBe(false);
});

test('a query the editor selects by itself does not replace the component configuration', () => {
  act(() => state().setRightSidebarOpen(true));

  act(() => state().queryPanel.setSelectedQuery('q2', 'canvas', { reveal: false }));

  expect(state().activeRightSideBarTab).toBe('configuration');
});

test('re-selecting the selected query does not reopen a right panel the user closed', () => {
  act(() => state().queryPanel.setSelectedQuery('q1'));
  act(() => state().setRightSidebarOpen(false));

  act(() => state().queryPanel.setSelectedQuery('q1'));

  expect(state().isRightSidebarOpen).toBe(false);
});
