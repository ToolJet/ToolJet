/**
 * Unit tests for RolesUtilService.checkIfBuilderLevelResourcesPermissions.
 *
 * This predicate decides whether a group counts as "builder-level" — which in turn
 * gates whether end-users can be added to it (server/src/modules/group-permissions/util.service.ts,
 * addUsersToGroup -> getGroupWithBuilderLevel). Module permissions (ResourceType.MODULE) are never
 * assignable to end-users, regardless of Build-with (view-only) or Edit — this suite locks that in.
 *
 * Strategy: mock dbTransactionWrap (bypasses the need for a real DB connection/transaction) and
 * construct RolesUtilService directly with a stubbed groupPermissionsRepository.
 */

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => {
    return cb(manager ?? {});
  }),
}));

import { RolesUtilService } from '../../../../src/modules/roles/util.service';
import { ResourceType } from '../../../../src/modules/group-permissions/constants';

function makePermission(
  type: ResourceType,
  appPermission: {
    canEdit?: boolean;
    canView?: boolean;
    canAccessDevelopment?: boolean;
    canAccessStaging?: boolean;
    canAccessProduction?: boolean;
  } = {}
) {
  return {
    type,
    appsGroupPermissions: appPermission,
  } as any;
}

function makeService(getAllGranularPermissions: jest.Mock, getLicenseTerms?: jest.Mock): RolesUtilService {
  const groupPermissionsRepository = { getAllGranularPermissions } as any;
  const licenseTermsService = {
    getLicenseTerms: getLicenseTerms ?? jest.fn(),
  } as any;
  return new RolesUtilService(groupPermissionsRepository, null as any, licenseTermsService);
}

describe('RolesUtilService.checkIfBuilderLevelResourcesPermissions', () => {
  const groupId = 'group-uuid-1';
  const organizationId = 'org-uuid-1';

  it('returns falsy when the group has no granular permissions', async () => {
    const service = makeService(jest.fn().mockResolvedValue(null));

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeFalsy();
  });

  it('returns falsy for a group with only APP view (canView) permission', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makePermission(ResourceType.APP, { canEdit: false, canView: true })])
    );

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeFalsy();
  });

  it('returns truthy for a group with APP edit (canEdit) permission — existing behaviour', async () => {
    const service = makeService(jest.fn().mockResolvedValue([makePermission(ResourceType.APP, { canEdit: true })]));

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeTruthy();
  });

  it('returns truthy for a group with any DATA_SOURCE permission — existing behaviour', async () => {
    const service = makeService(jest.fn().mockResolvedValue([makePermission(ResourceType.DATA_SOURCE)]));

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeTruthy();
  });

  it('returns truthy for a group with module Build-with (view-only) permission — the fix', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makePermission(ResourceType.MODULE, { canEdit: false, canView: true })])
    );

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeTruthy();
  });

  it('returns truthy for a group with module Edit permission — the fix', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makePermission(ResourceType.MODULE, { canEdit: true, canView: false })])
    );

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeTruthy();
  });

  it('returns truthy for a group with module permission mixed with other view-only permissions', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([
        makePermission(ResourceType.APP, { canEdit: false, canView: true }),
        makePermission(ResourceType.MODULE, { canEdit: false, canView: true }),
      ])
    );

    await expect(service.checkIfBuilderLevelResourcesPermissions(groupId, organizationId)).resolves.toBeTruthy();
  });
});

/**
 * Unit tests for RolesUtilService.checkIfBuilderLevelEnvironmentPermissions (new method):
 * non-Released environment access (Development/Staging/Production) counts as builder-level
 * only when the org lacks the `release` license.
 */
describe('RolesUtilService.checkIfBuilderLevelEnvironmentPermissions', () => {
  const groupId = 'group-uuid-1';
  const organizationId = 'org-uuid-1';

  it('returns falsy when a non-Released environment is granted and the org has the release license', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makePermission(ResourceType.APP, { canAccessProduction: true })]),
      jest.fn().mockResolvedValue(true)
    );

    await expect(service.checkIfBuilderLevelEnvironmentPermissions(groupId, organizationId)).resolves.toBeFalsy();
  });

  it('returns truthy when a non-Released environment is granted and the org lacks the release license', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makePermission(ResourceType.APP, { canAccessDevelopment: true })]),
      jest.fn().mockResolvedValue(false)
    );

    await expect(service.checkIfBuilderLevelEnvironmentPermissions(groupId, organizationId)).resolves.toBeTruthy();
  });
});

// isEditableGroup now ORs in the check above - one test locking in that new branch is enough,
// since checkIfBuilderLevelEnvironmentPermissions itself is already covered above.
describe('RolesUtilService.isEditableGroup', () => {
  it('returns truthy purely from the new environment-permissions branch', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makePermission(ResourceType.APP, { canAccessStaging: true })]),
      jest.fn().mockResolvedValue(false)
    );
    const group = { id: 'group-uuid-2', isAll: false } as any;

    await expect(service.isEditableGroup(group, 'org-uuid-1')).resolves.toBeTruthy();
  });
});
