/**
 * The Inspector lives in the runtime drawer, not the left panel. "State inspector" on a component, the
 * Inspector's Inspect menu and the Entity usage links open the drawer on its Inspector tab with that node
 * selected, and leave the left slot alone (the old 'inspect' left panel no longer exists).
 */
import React from 'react';
import { act, fireEvent, renderHook } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { QueryPanel } from '@/AppBuilder/QueryPanel/QueryPanel';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import useEntityNavigation from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const withModule = ({ children }) => (
  <ModuleProvider moduleId="canvas" isModuleMode={false}>
    {children}
  </ModuleProvider>
);
const tab = (id) => document.querySelector(`[data-cy="runtime-panel-tab-${id}"]`);

const expectDrawerOnInspector = (path) => {
  const state = useStore.getState();
  expect(state.queryPanel.isQueryPaneExpanded).toBe(true);
  expect(state.selectedNodePath).toBe(path);
  expect(tab('inspect')).toHaveClass('active');
  expect(state.selectedSidebarItem).not.toBe('inspect');
  expect(state.isSidebarOpen).toBe(false);
};

beforeEach(() => {
  controls.observers.install();
  localStorage.removeItem('runtimePanelPreferences');
  act(() => {
    useStore.getState().toggleLeftSidebar(false);
    useStore.getState().setSelectedSidebarItem(null);
    useStore.getState().queryPanel.setIsQueryPaneExpanded(false);
  });
  render(<QueryPanel darkMode={false} />, { wrapper: withModule });
});

afterEach(() => controls.restore());

test('State inspector on a component opens the drawer on the Inspector, even from the Debugger tab', () => {
  fireEvent.click(tab('debugger'));
  fireEvent.click(document.querySelector('[data-cy="query-manager-toggle-button"]'));
  expect(useStore.getState().queryPanel.isQueryPaneExpanded).toBe(false);

  act(() => useStore.getState().setComponentToInspect('button1'));

  expectDrawerOnInspector('components.button1');
});

test.each([
  [{ kind: 'variable', name: 'count' }, 'variables.count'],
  [{ kind: 'global', name: 'currentUser' }, 'globals.currentUser'],
])('Entity usage link for %o opens the drawer on the Inspector', (entry, path) => {
  const { result } = renderHook(() => useEntityNavigation(), { wrapper: withModule });

  act(() => {
    result.current(entry);
  });

  expectDrawerOnInspector(path);
});
