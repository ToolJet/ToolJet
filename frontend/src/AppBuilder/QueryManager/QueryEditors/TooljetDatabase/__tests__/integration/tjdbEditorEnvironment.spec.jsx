// The TJDB query editor must describe the table as it exists in the app's selected environment.
// A column added in development and not yet promoted must not appear while the app is on staging,
// so the editor's schema reads carry the App Builder's environment, not the TJDB dashboard's.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, waitFor, act } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
import ToolJetDbOperations from '../../ToolJetDbOperations';

const ORGANIZATION_ID = 'org-1';
const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };
const PRODUCTION = { id: 'env-production', name: 'production', priority: 3 };

function serveTables(requestedEnvironments) {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/tables', () =>
      HttpResponse.json({ result: [{ id: 'table-1', table_name: 'orders' }] })
    ),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', ({ request }) => {
      requestedEnvironments.push(new URL(request.url).searchParams.get('environment_id'));
      return HttpResponse.json({ result: { columns: [], foreign_keys: [] } });
    })
  );
}

const renderEditor = () =>
  render(
    <ToolJetDbOperations
      options={{ table_id: 'table-1' }}
      optionchanged={() => {}}
      optionsChanged={() => {}}
      darkMode={false}
      renderCopilot={() => null}
    />
  );

describe('TJDB query editor environment', () => {
  beforeEach(() => {
    jest
      .spyOn(authenticationService, 'currentSessionValue', 'get')
      .mockReturnValue({ current_organization_id: ORGANIZATION_ID });
  });

  afterEach(() => jest.restoreAllMocks());

  test('should read the table schema from the app builder selected environment', async () => {
    const requestedEnvironments = [];
    serveTables(requestedEnvironments);
    act(() => useStore.setState({ selectedEnvironment: STAGING }));

    renderEditor();

    await waitFor(() => expect(requestedEnvironments).toEqual([STAGING.id]));
  });

  test('should re-read the table schema when the app builder switches environment', async () => {
    const requestedEnvironments = [];
    serveTables(requestedEnvironments);
    act(() => useStore.setState({ selectedEnvironment: STAGING }));

    renderEditor();
    await waitFor(() => expect(requestedEnvironments).toEqual([STAGING.id]));

    act(() => useStore.setState({ selectedEnvironment: PRODUCTION }));

    await waitFor(() => expect(requestedEnvironments).toEqual([STAGING.id, PRODUCTION.id]));
  });
});
