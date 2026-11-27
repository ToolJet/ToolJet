/**
 * "Show this query" (Dependencies' View query, a code search hit, a Debugger log, an Inspector query)
 * opens the query editor in the right panel. The bottom drawer holds the Inspector and Debugger now,
 * so these jumps must leave it as the user had it.
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import useEntityNavigation from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';

const state = () => useStore.getState();

beforeEach(() => {
  localStorage.removeItem('queryManagerPreferences');
  act(() => {
    state().dataQuery.setQueries([{ id: 'q1', name: 'runjs1', kind: 'runjs', options: {} }], 'canvas');
    state().queryPanel.setSelectedQuery(null);
    state().queryPanel.setIsQueryPaneExpanded(false);
    state().setActiveRightSideBarTab('configuration');
    state().setRightSidebarOpen(false);
  });
});

test('revealing a query opens its editor in the right panel and leaves the drawer closed', () => {
  act(() => state().queryPanel.setSelectedQuery('q1', 'canvas', { reveal: false }));

  act(() => state().queryPanel.revealQueryEditor());

  expect(state().isRightSidebarOpen).toBe(true);
  expect(state().activeRightSideBarTab).toBe('query');
  expect(state().queryPanel.isQueryPaneExpanded).toBe(false);
});

test("Dependencies' View query opens the query without opening the drawer", () => {
  const { result } = renderHook(() => useEntityNavigation(), {
    wrapper: ({ children }) => (
      <ModuleProvider moduleId="canvas" isModuleMode={false}>
        {children}
      </ModuleProvider>
    ),
  });

  act(() => {
    result.current({ kind: 'query', id: 'q1', name: 'runjs1' });
  });

  expect(state().queryPanel.selectedQuery?.id).toBe('q1');
  expect(state().activeRightSideBarTab).toBe('query');
  expect(state().queryPanel.isQueryPaneExpanded).toBe(false);
});
