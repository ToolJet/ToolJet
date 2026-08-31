/**
 * Unit tests for GroupPermissionsUtilService.checkIfGroupHasBuilderGranularPermissions.
 *
 * This predicate (alongside RolesUtilService.checkIfBuilderLevelResourcesPermissions) gates
 * whether end-users can be added to a group (addUsersToGroup). It previously only inspected
 * ResourceType.APP/WORKFLOWS (canEdit) and ResourceType.FOLDER (canEditFolder/canEditApps) —
 * a group whose ONLY granular permission was a WORKFLOW_FOLDER edit-tier grant was never
 * flagged as builder-level, silently letting end-users into it. This suite locks in the fix.
 *
 * Module folders are covered separately in RolesUtilService.checkIfBuilderLevelResourcesPermissions
 * (any MODULE_FOLDER grant, even view-only, is disqualifying — modules aren't end-user-visible
 * at all) — this file only covers the edit-tier WORKFLOW_FOLDER rule (view-only stays safe,
 * matching plain FOLDER).
 */

import { GroupPermissionsUtilService } from '../../../../src/modules/group-permissions/util.service';
import { ResourceType } from '../../../../src/modules/group-permissions/constants';

function makeFolderPermission(
  type: ResourceType,
  fp: { canEditFolder?: boolean; canEditApps?: boolean; canViewApps?: boolean }
) {
  return { type, foldersGroupPermissions: fp } as any;
}

function makeService(getAllGranularPermissions: jest.Mock): GroupPermissionsUtilService {
  const groupPermissionsRepository = { getAllGranularPermissions } as any;
  return new GroupPermissionsUtilService(
    groupPermissionsRepository,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any
  );
}

describe('GroupPermissionsUtilService.checkIfGroupHasBuilderGranularPermissions', () => {
  const groupId = 'group-uuid-1';
  const organizationId = 'org-uuid-1';

  it('returns false for a group with WORKFLOW_FOLDER view-only permission', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makeFolderPermission(ResourceType.WORKFLOW_FOLDER, { canViewApps: true })])
    );

    await expect(service.checkIfGroupHasBuilderGranularPermissions(groupId, organizationId)).resolves.toBe(false);
  });

  it('returns true for a group with WORKFLOW_FOLDER canEditFolder permission — the fix', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makeFolderPermission(ResourceType.WORKFLOW_FOLDER, { canEditFolder: true })])
    );

    await expect(service.checkIfGroupHasBuilderGranularPermissions(groupId, organizationId)).resolves.toBe(true);
  });

  it('returns true for a group with WORKFLOW_FOLDER canEditApps permission — the fix', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makeFolderPermission(ResourceType.WORKFLOW_FOLDER, { canEditApps: true })])
    );

    await expect(service.checkIfGroupHasBuilderGranularPermissions(groupId, organizationId)).resolves.toBe(true);
  });

  it('returns true for a group with plain FOLDER canEditFolder permission — existing behaviour', async () => {
    const service = makeService(
      jest.fn().mockResolvedValue([makeFolderPermission(ResourceType.FOLDER, { canEditFolder: true })])
    );

    await expect(service.checkIfGroupHasBuilderGranularPermissions(groupId, organizationId)).resolves.toBe(true);
  });

  it('returns false for a group with no granular permissions', async () => {
    const service = makeService(jest.fn().mockResolvedValue([]));

    await expect(service.checkIfGroupHasBuilderGranularPermissions(groupId, organizationId)).resolves.toBe(false);
  });
});
