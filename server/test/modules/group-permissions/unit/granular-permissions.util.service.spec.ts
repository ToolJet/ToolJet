/**
 * Unit tests for the multi-environment license gating in GranularPermissionsUtilService:
 *
 * - validateEnvironmentPermissions: called on permission creation for APP-type resources.
 * - validateResourceAction's isEnvironmentPermissions branch: same gating on permission update.
 *
 * Both allow non-Released environment access (Development/Staging/Production) for a group with
 * end-users only when the org has the `multiEnvironment` license; otherwise they reject it the same
 * way a builder-level permission change would be rejected. Environment access is not gated by the
 * `release` flag, which only covers promote and release.
 */

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => {
    return cb(manager ?? {});
  }),
}));

import { GranularPermissionsUtilService } from '../../../../src/modules/group-permissions/util-services/granular-permissions.util.service';
import { ERROR_HANDLER } from '../../../../src/modules/group-permissions/constants/error';
import { LICENSE_FIELD } from '../../../../src/modules/licensing/constants';

function makeService(opts: { getUsersInGroup?: jest.Mock; getRoleUsersList?: jest.Mock; getLicenseTerms?: jest.Mock }) {
  const groupPermissionsRepository = { getUsersInGroup: opts.getUsersInGroup ?? jest.fn() } as any;
  const roleRepository = { getRoleUsersList: opts.getRoleUsersList ?? jest.fn() } as any;
  const licenseTermsService = { getLicenseTerms: opts.getLicenseTerms ?? jest.fn() } as any;
  return new GranularPermissionsUtilService(
    null as any,
    groupPermissionsRepository,
    roleRepository,
    licenseTermsService
  );
}

const groupId = 'group-uuid-1';
const organizationId = 'org-uuid-1';
const endUsers = [{ id: 'user-1', email: 'enduser@example.com', userGroups: [{ group: { id: groupId } }] }];

describe('GranularPermissionsUtilService.validateEnvironmentPermissions', () => {
  it('resolves when the org has the multi-environment license', async () => {
    const getLicenseTerms = jest.fn().mockResolvedValue(true);
    const service = makeService({ getLicenseTerms });

    await expect(
      service.validateEnvironmentPermissions(
        { groupId, organizationId, isBuilderPermissions: false },
        { canAccessProduction: true },
        {} as any
      )
    ).resolves.toBeUndefined();
    expect(getLicenseTerms).toHaveBeenCalledWith(LICENSE_FIELD.MULTI_ENVIRONMENT, organizationId);
  });

  it('throws when the org lacks the multi-environment license and the group has end-users', async () => {
    const service = makeService({
      getLicenseTerms: jest.fn().mockResolvedValue(false),
      getUsersInGroup: jest.fn().mockResolvedValue([{ userId: 'user-1' }]),
      getRoleUsersList: jest.fn().mockResolvedValue(endUsers),
    });

    await expect(
      service.validateEnvironmentPermissions(
        { groupId, organizationId, isBuilderPermissions: false },
        { canAccessStaging: true },
        {} as any
      )
    ).rejects.toMatchObject({ response: { message: { error: ERROR_HANDLER.EDITOR_LEVEL_PERMISSIONS_NOT_ALLOWED } } });
  });
});

describe('GranularPermissionsUtilService.validateResourceAction (environment-permissions branch)', () => {
  const params = { organizationId, groupId, isBuilderPermissions: false, isEnvironmentPermissions: true };

  it('returns early when licensed, even with end-users present and role-change disallowed', async () => {
    const getLicenseTerms = jest.fn().mockResolvedValue(true);
    const service = makeService({ getLicenseTerms });

    await expect((service as any).validateResourceAction(params, false, {} as any)).resolves.toBeUndefined();
    expect(getLicenseTerms).toHaveBeenCalledWith(LICENSE_FIELD.MULTI_ENVIRONMENT, organizationId);
  });

  it('throws MethodNotAllowedException when unlicensed, end-users present, and role-change disallowed', async () => {
    const service = makeService({
      getLicenseTerms: jest.fn().mockResolvedValue(false),
      getUsersInGroup: jest.fn().mockResolvedValue([{ userId: 'user-1' }]),
      getRoleUsersList: jest.fn().mockResolvedValue(endUsers),
    });

    await expect((service as any).validateResourceAction(params, false, {} as any)).rejects.toMatchObject({
      response: { message: { error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP } },
    });
  });
});
