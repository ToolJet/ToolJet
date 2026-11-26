/**
 * Editor header version dropdown: the version switcher button opens a popover listing the app's
 * versions, picking one switches the editor to it, and Escape or a click outside closes the list.
 * The environment tabs above the list exist only in the enterprise edition.
 */
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { act, screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { authenticationService } from '@/_services';
import useStore from '@/AppBuilder/_stores/store';
import VersionManagerDropdown from '@/AppBuilder/Header/VersionManager/VersionManagerDropdown';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render, userEvent } from '@/test/test-utils';

const API = 'http://localhost:3000/api';
const controls = createAppBuilderControls();
const state = () => useStore.getState();

const development = { id: 'env-dev', name: 'development', priority: 1, enabled: true, appVersionsCount: 2 };
const staging = { id: 'env-staging', name: 'staging', priority: 2, enabled: true, appVersionsCount: 1 };
const draft = { id: 'version-1', name: 'v1', status: 'DRAFT', versionType: 'version', currentEnvironmentId: 'env-dev' };
const saved = {
  id: 'version-2',
  name: 'v2',
  status: 'PUBLISHED',
  versionType: 'version',
  currentEnvironmentId: 'env-dev',
};

const session = authenticationService.currentSessionValue;
const eeTest = process.env.TOOLJET_EDITION === 'ce' ? test.skip : test;

let versionRequests;

const switcher = () => screen.getByRole('button', { name: /^v\d\s*Development$/ });
const versionList = () => screen.findByRole('tooltip');
const open = async (user) => {
  await user.click(switcher());
  return versionList();
};

beforeEach(async () => {
  controls.observers.install();
  versionRequests = [];
  server.use(
    http.get(`${API}/app-environments/init`, () =>
      HttpResponse.json({
        environments: [development, staging],
        editorEnvironment: development,
        appVersionEnvironment: development,
        editorVersion: draft,
      })
    ),
    http.get(`${API}/app-environments/env-dev/versions`, () => HttpResponse.json({ appVersions: [draft, saved] })),
    http.get(`${API}/app-environments/env-staging/versions`, () => HttpResponse.json({ appVersions: [saved] })),
    http.get(`${API}/v2/apps/app-1/versions/:versionId`, ({ params }) => {
      versionRequests.push(params.versionId);
      return HttpResponse.json({ editing_version: [draft, saved].find((version) => version.id === params.versionId) });
    })
  );
  await act(async () => {
    state().setApp({ appId: 'app-1', appName: 'Orders', slug: 'orders' }, 'canvas');
    state().setCurrentVersionId('version-1');
    await state().init('version-1');
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <VersionManagerDropdown />
    </ModuleProvider>
  );
  await waitFor(() => expect(state().developmentVersions).toHaveLength(2));
});

afterEach(() => {
  controls.restore();
  authenticationService.updateCurrentSession(session);
});

test('the version switcher button names the version and environment being edited', () => {
  expect(switcher()).toHaveTextContent('v1');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('clicking the version switcher button lists the versions of the app', async () => {
  const list = await open(userEvent.setup());

  expect(await within(list).findByText('v2')).toBeInTheDocument();
  expect(within(list).getByText('v1')).toBeInTheDocument();
  expect(within(list).getByRole('button', { name: 'Create draft version' })).toBeInTheDocument();
});

test('picking another version switches the editor to it and closes the list', async () => {
  const user = userEvent.setup();
  const list = await open(user);

  await user.click(await within(list).findByText('v2'));

  await waitFor(() => expect(state().currentVersionId).toBe('version-2'));
  expect(versionRequests).toEqual(['version-2']);
  expect(state().selectedVersion).toMatchObject({ id: 'version-2', name: 'v2' });
  expect(switcher()).toHaveTextContent('v2');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('picking the version already being edited closes the list without reloading it', async () => {
  const user = userEvent.setup();
  const list = await open(user);
  await within(list).findByText('v2');

  await user.click(within(list).getByText('v1'));

  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  expect(versionRequests).toEqual([]);
  expect(state().currentVersionId).toBe('version-1');
});

test('Escape closes the list', async () => {
  const user = userEvent.setup();
  await open(user);

  await user.keyboard('{Escape}');

  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
});

test('a click outside closes the list', async () => {
  const user = userEvent.setup();
  await open(user);

  await user.click(document.body);

  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
});

eeTest('picking another environment tab lists the versions of that environment', async () => {
  server.use(
    http.get(`${API}/license/access`, () =>
      HttpResponse.json({ multiEnvironment: true, licenseStatus: { isLicenseValid: true, isExpired: false } })
    )
  );
  act(() => {
    authenticationService.updateCurrentSession({
      ...session,
      app_group_permissions: { is_all_editable: true, environment_access: { development: true, staging: true } },
    });
    state().updateFeatureAccess();
  });
  await waitFor(() => expect(state().license.featureAccess?.multiEnvironment).toBe(true));
  const user = userEvent.setup();
  const list = await open(user);
  await within(list).findByText('v1');

  await user.click(within(list).getByRole('button', { name: 'Staging' }));

  await waitFor(() => expect(within(list).queryByText('v1')).not.toBeInTheDocument());
  expect(within(list).getByText('v2')).toBeInTheDocument();
  expect(state().selectedEnvironment).toMatchObject({ id: 'env-dev' });
});
