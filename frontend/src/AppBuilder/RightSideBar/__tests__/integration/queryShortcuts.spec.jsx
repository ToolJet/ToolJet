/**
 * Cmd+Enter runs the selected query while the right panel shows it. The runtime drawer at the bottom
 * no longer holds the query editor, so whether it is open must not matter (it starts closed).
 *
 * Observable: runQuery writes `{ isLoading: true }` into exposedValues.queries[id] as it starts.
 */
import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { RightSideBar } from '@/AppBuilder/RightSideBar/RightSideBar';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { useQueryPanelKeyHooks } from '@/AppBuilder/CodeEditor/useQueryPanelKeyHooks';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const state = () => useStore.getState();
const QUERY = { id: 'q1', name: 'query1', kind: 'restapi', options: { url: 'https://example.com', method: 'get' } };
const didRun = () => state().resolvedStore.modules.canvas.exposedValues.queries?.q1?.isLoading === true;

const inEditor = ({ children }) => (
  <MemoryRouter initialEntries={['/apps/app-1']}>
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      {children}
    </ModuleProvider>
  </MemoryRouter>
);

beforeEach(() => {
  controls.observers.install();
  server.use(http.all('https://example.com/*', () => HttpResponse.json({})));
  seedApp({});
  act(() => {
    state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
    state().dataQuery.setQueries([QUERY], 'canvas');
    state().setQueryMapping('canvas');
    state().queryPanel.setSelectedQuery('q1');
    state().queryPanel.setIsQueryPaneExpanded(false);
    state().queryPanel.setQueryPanelHeight(0);
    state().setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.QUERY);
    state().setRightSidebarOpen(true);
  });
});

afterEach(() => controls.restore());

test('Cmd+Enter in a query code box runs the query with the runtime drawer closed', () => {
  const { result } = renderHook(() => useQueryPanelKeyHooks(() => {}, 'x', 'singleline'), { wrapper: inEditor });

  act(() => {
    result.current.queryPanelKeybindings.find(({ key }) => key === 'Mod-Enter').run();
  });

  expect(didRun()).toBe(true);
});

test('Cmd+Enter outside a code box runs the query shown in the right panel', () => {
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <RightSideBar darkMode={false} />
    </ModuleProvider>,
    { route: '/apps/app-1' }
  );

  act(() => {
    fireEvent.keyDown(document.body, { key: 'Enter', code: 'Enter', metaKey: true, ctrlKey: true });
  });

  expect(didRun()).toBe(true);
});
