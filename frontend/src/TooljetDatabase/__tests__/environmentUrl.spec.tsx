// The selected environment lives in the URL (`?env=`) so a refresh or a shared link opens the same one. Same rules as
// the workspace constants page: the URL beats the saved value, development is the default and leaves the URL, and a
// value the workspace cannot use is dropped.
import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderHook, act } from '@testing-library/react';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { useEnvironmentUrl } from '@/TooljetDatabase/HeaderEnvironment/useEnvironmentUrl';

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1 };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };
const PRODUCTION = { id: 'env-production', name: 'production', priority: 3 };

const serveEnvironments = (environments: object[]) =>
  server.use(http.get('*/app-environments', () => HttpResponse.json({ environments })));

function renderUrlHook(route: string) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </MemoryRouter>
  );
  return renderHook(() => ({ urlEnvironmentId: useEnvironmentUrl(), search: useLocation().search }), { wrapper });
}

const params = (search: string) => Object.fromEntries(new URLSearchParams(search));

beforeEach(() => {
  window.sessionStorage.clear();
  act(() => useTjdbStore.getState().actions.resetStore());
});

describe('loadEnvironments', () => {
  test('should select the environment named by the URL over the saved one', async () => {
    serveEnvironments([DEVELOPMENT, STAGING, PRODUCTION]);
    window.sessionStorage.setItem('tjdb-selected-environment-id', STAGING.id);

    await act(() => useTjdbStore.getState().actions.loadEnvironments(PRODUCTION.id));

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(PRODUCTION);
  });

  test('should fall back to the saved environment when the URL names one the workspace does not have', async () => {
    serveEnvironments([DEVELOPMENT, STAGING]);
    window.sessionStorage.setItem('tjdb-selected-environment-id', STAGING.id);

    await act(() => useTjdbStore.getState().actions.loadEnvironments('not-an-environment'));

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(STAGING);
  });

  test('should ignore a locked environment named by the URL', async () => {
    const lockedStaging = { ...STAGING, enabled: false };
    serveEnvironments([DEVELOPMENT, lockedStaging]);

    await act(() => useTjdbStore.getState().actions.loadEnvironments(lockedStaging.id));

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(DEVELOPMENT);
  });

  test('should select development when neither the URL nor storage names an environment', async () => {
    serveEnvironments([DEVELOPMENT, STAGING]);

    await act(() => useTjdbStore.getState().actions.loadEnvironments(null));

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(DEVELOPMENT);
  });
});

describe('useEnvironmentUrl', () => {
  test('should hand back the environment id the page opened with', () => {
    const { result } = renderUrlHook('/database?env=env-staging');

    expect(result.current.urlEnvironmentId).toBe('env-staging');
  });

  test('should leave the URL alone until an environment is selected', () => {
    const { result } = renderUrlHook('/database?env=env-staging');

    expect(params(result.current.search)).toEqual({ env: 'env-staging' });
  });

  test('should write a non-default environment to the URL and keep the other params', () => {
    const { result } = renderUrlHook('/database?table=table-1');

    act(() => useTjdbStore.setState({ selectedEnvironment: STAGING }));

    expect(params(result.current.search)).toEqual({ table: 'table-1', env: STAGING.id });
  });

  test('should remove env from the URL when development is selected', () => {
    const { result } = renderUrlHook('/database?table=table-1&env=env-staging');

    act(() => useTjdbStore.setState({ selectedEnvironment: DEVELOPMENT }));

    expect(params(result.current.search)).toEqual({ table: 'table-1' });
  });

  test('should follow a later switch of environment', async () => {
    const { result } = renderUrlHook('/database');
    act(() => useTjdbStore.setState({ selectedEnvironment: DEVELOPMENT }));

    await act(() => useTjdbStore.getState().actions.switchEnvironment(STAGING));

    expect(params(result.current.search)).toEqual({ env: STAGING.id });
  });

  test('should replace a locked environment in the URL with the one that was selected', async () => {
    const lockedStaging = { ...STAGING, enabled: false };
    serveEnvironments([DEVELOPMENT, lockedStaging]);
    const { result } = renderUrlHook('/database?env=env-staging');

    await act(() => useTjdbStore.getState().actions.loadEnvironments(result.current.urlEnvironmentId));

    expect(params(result.current.search)).toEqual({});
  });
});
