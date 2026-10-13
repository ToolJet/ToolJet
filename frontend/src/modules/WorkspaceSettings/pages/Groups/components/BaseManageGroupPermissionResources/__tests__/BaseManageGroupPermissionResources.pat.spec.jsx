import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, userEvent } from '@/test/test-utils';
import { server } from '@/test/msw/server';
import BaseManageGroupPermissionResources from '../BaseManageGroupPermissionResources';

// The component's import graph reaches the whole app (circular through @/_services). Keep the real
// group-permission service and response handling so MSW sees the real requests; stub the unrelated rest.
jest.mock('@/_services', () => ({
  groupPermissionV2Service: jest.requireActual('@/_services/groupPermission.v2.service').groupPermissionV2Service,
  authenticationService: { currentSessionValue: { admin: true } },
}));
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ 'Content-Type': 'application/json' }),
  ...jest.requireActual('@/_helpers/handle-response'),
}));
jest.mock('@/_components', () => ({ FilterPreview: () => null, MultiSelectUser: () => null }));
jest.mock('@/_components/SearchBox', () => ({ SearchBox: () => null }));
jest.mock('@/_components/ToolTip', () => ({ ToolTip: ({ children }) => children }));
jest.mock('@/modules/common/components', () => ({ EditRoleErrorModal: () => null, Loader: () => null }));
jest.mock('../../ManageGranularAccess', () => () => null);
jest.mock('../../ChangeRoleModal', () => () => null);
jest.mock('../VirtualizedUserList', () => () => null);
// Edition-registry wrappers: resolving them loads the whole app through componentRegistry.
jest.mock('../../DataSourcePermissionsUI', () => () => null);
jest.mock('../../WorkflowPermissionsUI', () => () => null);
jest.mock('../../ModulePermissionsUI', () => () => null);
jest.mock('../../AppPromoteReleasePermissionsUI', () => () => null);

// Edition is the only controlled input: the PAT row is hidden in CE.
jest.mock('config', () => ({
  ...jest.requireActual('config'),
  TOOLJET_EDITION: 'ee',
}));

const API = 'http://localhost:3000/api/v2/group-permissions';
const GROUP_ID = 'builder-group-id';

const builderGroup = {
  id: GROUP_ID,
  name: 'builder',
  type: 'default',
  appCreate: true,
  appDelete: true,
  patCreate: true,
  patRevoke: false,
};

function useGroupHandlers(group, onUpdate = jest.fn()) {
  server.use(
    http.get(`${API}/${GROUP_ID}`, () => HttpResponse.json({ group, isBuilderLevel: true })),
    http.get(`${API}/${GROUP_ID}/users`, () => HttpResponse.json([])),
    http.put(`${API}/${GROUP_ID}`, async ({ request }) => {
      onUpdate(await request.json());
      return HttpResponse.json({});
    })
  );
  return onUpdate;
}

function renderPermissions() {
  return render(
    <BaseManageGroupPermissionResources
      groupPermissionId={GROUP_ID}
      selectedGroup="Builder"
      roleOptions={[]}
      darkMode={false}
      updateGroupName={jest.fn()}
      // Valid license, custom groups off: PAT stays editable on the default Builder group.
      featureAccess={{
        licenseStatus: { isExpired: false, isLicenseValid: true },
        plan: 'enterprise',
        customGroups: false,
      }}
    />
  );
}

describe('BaseManageGroupPermissionResources | Personal access token row', () => {
  it('should show Create checked and Revoke unchecked for the Builder group, with descriptions', async () => {
    useGroupHandlers(builderGroup);

    renderPermissions();

    const create = await screen.findByRole('checkbox', { name: /Create a token in this workspace/ });
    const revoke = screen.getByRole('checkbox', { name: /Revoke a token in this workspace/ });
    expect(screen.getByText('Personal access token')).toBeInTheDocument();
    expect(create).toBeChecked();
    expect(revoke).not.toBeChecked();
    expect(create).toBeEnabled();
  });

  it.each([
    ['Create a token in this workspace', { patCreate: false }],
    ['Revoke a token in this workspace', { patRevoke: true }],
  ])('should call the update API when toggling "%s"', async (label, expectedBody) => {
    const onUpdate = useGroupHandlers(builderGroup);
    renderPermissions();

    await userEvent.click(await screen.findByRole('checkbox', { name: new RegExp(label) }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining(expectedBody)));
  });
});
