/**
 * Importing an app from the dashboard. Real HomePage + AppModal; MSW at the HTTP boundary.
 */
import '@/test/setupMsw';
import React from 'react';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
import { http, HttpResponse, ws } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import { authenticationService } from '@/_services';
import { Toaster } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { HomePage } from '@/HomePage/HomePage';

jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
jest.setTimeout(30000);

const controls = createAppBuilderControls();
let originalSession;
beforeEach(() => {
  controls.media.match(false);
  originalSession = authenticationService.currentSessionValue;
  window.public_config = { TOOLJET_HOST: 'http://localhost:8082' };
  authenticationService.updateCurrentSession({
    current_organization_id: 'workspace-a',
    current_organization_slug: 'workspace-a',
    group_permissions: [],
    load_app: true,
    role: { name: 'admin' },
    admin: true,
    current_user: { id: 'user', organization_id: 'workspace-a' },
    app_group_permissions: { is_all_editable: true, is_all_viewable: true, editable_apps_id: [], viewable_apps_id: [] },
    user_permissions: { app_create: true, app_delete: true },
  });
  server.use(
    // The dashboard's notifications socket; nothing in this flow depends on it.
    ws.link('ws://localhost:3000/ws/notifications').addEventListener('connection', () => {}),
    http.get(`${config.apiUrl}/apps`, () =>
      HttpResponse.json({ apps: [], meta: { total_pages: 0, total_count: 0, folder_count: 0, current_page: 1 } })
    ),
    http.get(`${config.apiUrl}/folder-apps`, () => HttpResponse.json({ folders: [] })),
    http.get(`${config.apiUrl}/organizations`, () =>
      HttpResponse.json({ organizations: [{ id: 'workspace-a', name: 'Workspace A', slug: 'workspace-a' }] })
    ),
    http.get(`${config.apiUrl}/notifications`, () => HttpResponse.json({ notifications: [] })),
    http.get(`${config.apiUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    // Licence, limits, white-labelling, git-sync, credits: defaults are fine for an unlimited workspace.
    http.get(`${config.apiUrl}/*`, () => HttpResponse.json({})),
    http.post(`${config.apiUrl}/plugins/findDependentPlugins`, () =>
      HttpResponse.json({ pluginsToBeInstalled: [], pluginsListIdToDetailsMap: {} })
    ),
    // A library snapshot conflict inside the imported bundle, not an app-name conflict.
    http.post(`${config.apiUrl}/v2/resources/import`, () =>
      HttpResponse.json(
        { statusCode: 409, message: 'A draft or saved version with this name already exists', error: 'Conflict' },
        { status: 409 }
      )
    )
  );
});
afterEach(() => {
  controls.restore();
  authenticationService.updateCurrentSession(originalSession);
  delete window.public_config;
});

const bundle = {
  tooljet_version: '3.16.0',
  app: [{ definition: { appV2: { type: 'front-end', name: 'Orders', dataSources: [] } }, appName: 'Orders' }],
};

// F09: HomePage.jsx:754 returns false for every 409 and AppModal.jsx:95-96 turns that into "App name already
// exists", so a library snapshot conflict is reported as an app-name clash.
const importBundle = async () => {
  render(
    <BreadCrumbContext.Provider value={{ updateSidebarNAV: () => {} }}>
      <HomePage appType="front-end" darkMode={false} switchDarkMode={() => {}} />
      {/* The app shell mounts the toaster; the message may surface inline or as a toast. */}
      <Toaster />
    </BreadCrumbContext.Provider>
  );
  await waitFor(() => expect(document.querySelector('[data-cy="import-dropdown-menu"]')).toBeEnabled());
  await userEvent.click(document.querySelector('[data-cy="import-dropdown-menu"]'));
  const fileInput = document.querySelector('[data-cy="import-option-input"]');
  await userEvent.upload(fileInput, new File([JSON.stringify(bundle)], 'Orders.json', { type: 'application/json' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Import app' }));
};

it('shows the server message for an import 409 that is not an app-name conflict', async () => {
  await importBundle();
  expect(await screen.findByText('A draft or saved version with this name already exists')).toBeInTheDocument();
  expect(screen.queryByText('App name already exists')).not.toBeInTheDocument();
});

it('shows the app-name error in the modal for an app-name 409', async () => {
  server.use(
    http.post(`${config.apiUrl}/v2/resources/import`, () =>
      HttpResponse.json(
        { statusCode: 409, message: 'This app name is already taken.', error: 'Conflict' },
        { status: 409 }
      )
    )
  );
  await importBundle();
  expect(await screen.findByText('App name already exists')).toBeInTheDocument();
});
