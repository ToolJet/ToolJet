import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { authenticationService } from '@/_services';
import { readViewAs, saveViewAs } from '@/AppBuilder/_helpers/viewAs';
import { ViewAsChip, ViewAsPicker } from '../index';

const APP_ID = 'app-1';
const SALES = { id: '11111111-1111-4111-8111-111111111111', name: 'Sales', type: 'custom', count: 2 };
const ALICE = {
  id: '22222222-2222-4222-8222-222222222222',
  firstName: 'Alice',
  lastName: 'Ng',
  email: 'alice@example.com',
};

let featureAccess;

const scenario = defineAppBuilderScenario({
  id: 'view-as-preview',
  name: 'View as picker and chip in Preview settings',
  primarySeam: 'rtl',
  surface: 'authenticated-preview',
  edition: 'ee',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {
    storage: { clear: true },
    network: [
      { url: '*/license/access', json: () => featureAccess },
      { url: `*/app-permissions/${APP_ID}/pages/user-groups`, json: [SALES] },
      { url: `*/app-permissions/${APP_ID}/pages/users`, json: [ALICE] },
    ],
  },
});

const asEditor = { admin: false, app_group_permissions: { is_all_editable: false, editable_apps_id: [APP_ID] } };
const asViewer = { admin: false, app_group_permissions: { is_all_editable: false, editable_apps_id: [] } };

async function setup({ session = asEditor, licensed = true } = {}) {
  featureAccess = licensed ? { appPermissionComponent: true } : {};
  window.sessionStorage.clear();
  authenticationService.updateCurrentSession(session);
  const test = new AppBuilderTestSession({ scenario });
  await test.store.act('setApp', { appId: APP_ID });
  await test.store.act('setViewAs', null, null);
  await test.store.act('updateFeatureAccess');
  await waitFor(() => expect(test.store.read((state) => state.isLicenseFetched)).toBe(true));
  return test;
}

describe('View as', () => {
  test('[VAS-001] is hidden when the licence has no app permissions', async () => {
    const test = await setup({ licensed: false });
    test.render(<ViewAsPicker onApply={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'View as' })).not.toBeInTheDocument();
  });

  test('[VAS-002] is hidden from users who cannot edit the app', async () => {
    const test = await setup({ session: asViewer });
    test.render(<ViewAsPicker onApply={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'View as' })).not.toBeInTheDocument();
  });

  test('[VAS-003] lists the groups and users who can open the app, and applies a group', async () => {
    const onApply = jest.fn();
    const test = await setup();
    test.render(<ViewAsPicker onApply={onApply} />);

    await test.user.click(await screen.findByRole('button', { name: 'View as' }));
    expect(await screen.findByRole('option', { name: 'Alice Ng' })).toBeInTheDocument();
    await test.user.click(screen.getByRole('option', { name: 'Sales' }));

    expect(readViewAs(APP_ID)).toEqual({ kind: 'group', id: SALES.id, label: 'Sales' });
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  test('[VAS-004] applies a user', async () => {
    const onApply = jest.fn();
    const test = await setup();
    test.render(<ViewAsPicker onApply={onApply} />);

    await test.user.click(await screen.findByRole('button', { name: 'View as' }));
    await test.user.click(await screen.findByRole('option', { name: 'Alice Ng' }));

    expect(readViewAs(APP_ID)).toEqual({ kind: 'user', id: ALICE.id, label: 'Alice Ng' });
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  test('[VAS-005] going back to yourself clears the choice', async () => {
    const onApply = jest.fn();
    const test = await setup();
    saveViewAs(APP_ID, { kind: 'group', id: SALES.id, label: 'Sales' });
    await test.store.act('setViewAs', { kind: 'group', id: SALES.id, label: 'Sales' }, null);
    test.render(<ViewAsPicker onApply={onApply} />);

    await test.user.click(await screen.findByRole('button', { name: 'View as' }));
    await test.user.click(await screen.findByRole('option', { name: 'Yourself' }));

    expect(readViewAs(APP_ID)).toBeNull();
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  test('[VAS-008] search narrows the list to matching groups and users', async () => {
    const test = await setup();
    test.render(<ViewAsPicker onApply={jest.fn()} />);

    await test.user.click(await screen.findByRole('button', { name: 'View as' }));
    await screen.findByRole('option', { name: 'Alice Ng' });
    await test.user.type(screen.getByRole('textbox', { name: 'Search users and groups' }), 'ali');

    expect(screen.getByRole('option', { name: 'Alice Ng' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sales' })).not.toBeInTheDocument();
  });

  test('[VAS-006] the chip shows who is being simulated and exits back to yourself', async () => {
    const onApply = jest.fn();
    const test = await setup();
    saveViewAs(APP_ID, { kind: 'group', id: SALES.id, label: 'Sales' });
    await test.store.act('setViewAs', { kind: 'group', id: SALES.id, label: 'Sales' }, null);
    test.render(<ViewAsChip onApply={onApply} />);

    expect(screen.getByText('Viewing as Sales')).toBeInTheDocument();
    await test.user.click(screen.getByRole('button', { name: 'Stop viewing as Sales' }));

    expect(readViewAs(APP_ID)).toBeNull();
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  test('[VAS-007] the chip is absent when not simulating', async () => {
    const test = await setup();
    test.render(<ViewAsChip onApply={jest.fn()} />);

    expect(screen.queryByText(/Viewing as/)).not.toBeInTheDocument();
  });
});
