/**
 * GranularPermissionsUtilService — end-user validation for folder-type granular permissions
 * (createFolderGroupPermission / updateFoldersGroupPermission / validateFolderResourceCreation).
 *
 * Bug: DATA_SOURCE_FOLDER was treated as blanket "builder-only, like MODULE_FOLDER" — ANY
 * granular-permission create/update on a data-source folder was rejected for a group containing
 * an end-user, regardless of which boolean flags were actually set. That wrongly caught
 * `canRunQuery` ("Restrict query run"), which is the one data-source-folder flag meant to apply
 * TO end users (it restricts their query execution), not a builder-level grant:
 *   1. Creating a restriction-only grant (canEditFolder/canEditApps/canViewApps all false, only
 *      canRunQuery set) on a group that already has an end user — used to throw.
 *   2. Editing an existing restriction-only grant to just untick "Restrict query run" on a group
 *      that has an end user — used to throw too.
 *
 * The fix mirrors the already-correct logic in GroupPermissionsUtilService.
 * checkIfGroupHasBuilderGranularPermissions: for DATA_SOURCE_FOLDER, only canEditFolder /
 * canEditApps / canViewApps are builder-level; canRunQuery never is. MODULE_FOLDER stays blanket
 * builder-only (no end-user-safe tier at all), and plain FOLDER/WORKFLOW_FOLDER keep their
 * existing canEditFolder/canEditApps-only rule (view-only stays end-user-safe there).
 */
import { BadRequestException } from '@nestjs/common';
import { GranularPermissionsUtilService } from '@modules/group-permissions/util-services/granular-permissions.util.service';
import { ResourceType } from '@modules/group-permissions/constants';

jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any) => operation((globalThis as any).__fgpManager)),
}));

const ORG = 'org-1';
const GROUP = 'group-1';
const END_USER_EMAIL = 'enduser@tooljet.io';

describe('GranularPermissionsUtilService — folder granular permission end-user validation', () => {
  let service: GranularPermissionsUtilService;
  let manager: { create: jest.Mock; save: jest.Mock; update: jest.Mock; insert: jest.Mock };
  let groupHasEndUser: boolean;

  const makeGranularPermissions = (type: ResourceType, foldersGroupPermissions: Record<string, any> = {}) =>
    ({ id: 'gp-1', groupId: GROUP, type, foldersGroupPermissions }) as any;

  beforeEach(() => {
    groupHasEndUser = true;
    manager = {
      create: jest.fn((_entity: any, data: any) => data),
      save: jest.fn((data: any) => Promise.resolve({ id: 'fgp-1', ...data })),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    (globalThis as any).__fgpManager = manager;

    const groupPermissionsRepository = {
      getUsersInGroup: jest.fn().mockResolvedValue([{ userId: 'user-1' }]),
    } as any;
    const roleRepository = {
      getRoleUsersList: jest
        .fn()
        .mockImplementation(() => Promise.resolve(groupHasEndUser ? [{ email: END_USER_EMAIL }] : [])),
    } as any;

    service = new GranularPermissionsUtilService(null as any, groupPermissionsRepository, roleRepository, null as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createFolderGroupPermission', () => {
    const create = (type: ResourceType, flags: Record<string, boolean>) =>
      (service as any).createFolderGroupPermission(
        ORG,
        makeGranularPermissions(type),
        { resourcesToAdd: [], ...flags },
        manager
      );

    it('DATA_SOURCE_FOLDER: does NOT throw for a restriction-only grant (only canRunQuery) — the fix, repro #1', async () => {
      await expect(create(ResourceType.DATA_SOURCE_FOLDER, { canRunQuery: false })).resolves.toBeUndefined();
      expect(manager.save).toHaveBeenCalled();
    });

    it('DATA_SOURCE_FOLDER: throws for canViewApps ("Build with") on a group with an end user', async () => {
      await expect(create(ResourceType.DATA_SOURCE_FOLDER, { canViewApps: true })).rejects.toThrow(BadRequestException);
    });

    it('DATA_SOURCE_FOLDER: throws for canEditFolder on a group with an end user', async () => {
      await expect(create(ResourceType.DATA_SOURCE_FOLDER, { canEditFolder: true })).rejects.toThrow(
        BadRequestException
      );
    });

    it('DATA_SOURCE_FOLDER: error message is resource-specific, not "Module folder"', async () => {
      await expect(create(ResourceType.DATA_SOURCE_FOLDER, { canEditApps: true })).rejects.toMatchObject({
        response: { message: { error: expect.stringContaining('Data source folder permissions') } },
      });
    });

    it('MODULE_FOLDER: still throws even with every flag false — blanket builder-only, unchanged', async () => {
      await expect(create(ResourceType.MODULE_FOLDER, {})).rejects.toThrow(BadRequestException);
      await expect(create(ResourceType.MODULE_FOLDER, {})).rejects.toMatchObject({
        response: { message: { error: expect.stringContaining('Module folder permissions') } },
      });
    });

    it('plain FOLDER: does NOT throw for canViewApps-only (view-only stays end-user-safe) — control, unchanged', async () => {
      await expect(create(ResourceType.FOLDER, { canViewApps: true })).resolves.toBeUndefined();
    });

    it('plain FOLDER: throws for canEditFolder — control, unchanged', async () => {
      await expect(create(ResourceType.FOLDER, { canEditFolder: true })).rejects.toThrow(BadRequestException);
    });

    it('no end user in the group: never throws, even for a builder-level grant', async () => {
      groupHasEndUser = false;
      await expect(create(ResourceType.DATA_SOURCE_FOLDER, { canEditFolder: true })).resolves.toBeUndefined();
    });
  });

  describe('updateFoldersGroupPermission', () => {
    const update = (type: ResourceType, existing: Record<string, any>, actions: Record<string, any>) =>
      (service as any).updateFoldersGroupPermission(
        {
          granularPermissions: makeGranularPermissions(type, { id: 'fgp-1', ...existing }),
          actions,
          resourcesToDelete: [],
          resourcesToAdd: [],
        },
        ORG,
        manager
      );

    it('DATA_SOURCE_FOLDER: untick canRunQuery on an otherwise-restriction-only grant does NOT throw — the fix, repro #2', async () => {
      await expect(
        update(
          ResourceType.DATA_SOURCE_FOLDER,
          { canEditFolder: false, canEditApps: false, canViewApps: false, canRunQuery: true },
          { canRunQuery: false }
        )
      ).resolves.toBeUndefined();
      expect(manager.update).toHaveBeenCalled();
    });

    it('DATA_SOURCE_FOLDER: throws when the RESULTING state is builder-level even though this patch only touches canRunQuery', async () => {
      // canEditApps is already true from before and this update doesn't touch it — the merged
      // (resulting) value must still count, not just the raw patch.
      await expect(
        update(
          ResourceType.DATA_SOURCE_FOLDER,
          { canEditFolder: false, canEditApps: true, canViewApps: false, canRunQuery: true },
          { canRunQuery: false }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('DATA_SOURCE_FOLDER: throws when canViewApps is toggled on', async () => {
      await expect(
        update(
          ResourceType.DATA_SOURCE_FOLDER,
          { canEditFolder: false, canEditApps: false, canViewApps: false },
          {
            canViewApps: true,
          }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('MODULE_FOLDER: still throws regardless of which flags are touched — blanket builder-only, unchanged', async () => {
      await expect(
        update(ResourceType.MODULE_FOLDER, { canEditFolder: false, canEditApps: false }, { canEditApps: false })
      ).rejects.toThrow(BadRequestException);
    });

    it('plain FOLDER: untick canEditApps back to false, resulting state end-user-safe — does NOT throw', async () => {
      await expect(
        update(ResourceType.FOLDER, { canEditFolder: false, canEditApps: true }, { canEditApps: false })
      ).resolves.toBeUndefined();
    });

    it('no end user in the group: never throws, even for a builder-level update', async () => {
      groupHasEndUser = false;
      await expect(
        update(ResourceType.DATA_SOURCE_FOLDER, { canEditFolder: false }, { canEditFolder: true })
      ).resolves.toBeUndefined();
    });
  });
});
