/** @group platform */
jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest
    .fn()
    .mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => cb(manager)),
}));

import { BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { GranularPermissionsUtilService } from '@modules/group-permissions/util-services/granular-permissions.util.service';
import { ResourceType } from '@modules/group-permissions/constants';
import { AppBase } from '@entities/app_base.entity';
import { Folder } from '@entities/folder.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { GroupFolders } from '@entities/group_folders.entity';

const ORG = 'org-a';

// Rows that exist in the caller's workspace. Anything else is "another workspace's".
const inOrg = { [AppBase.name]: ['a-own'], [Folder.name]: ['f-own'] } as Record<string, string[]>;

function makeManager() {
  return {
    find: jest.fn(async (entity: { name: string }, opts: { where: { id: { value: string[] } } }) =>
      opts.where.id.value.filter((id) => inOrg[entity.name]?.includes(id)).map((id) => ({ id }))
    ),
    save: jest.fn(async (x) => ({ id: 'agp-1', ...x })),
    create: jest.fn((_entity, x) => x),
    insert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(async () => ({ id: 'agp-1' })),
  };
}

function makeService() {
  const service = new GranularPermissionsUtilService(null as any, null as any, null as any, null as any) as any;
  for (const name of [
    'validateResourceCreation',
    'validateEnvironmentPermissions',
    'validateFolderResourceCreation',
    'validateResourceAction',
    'validateAppResourcePermissionUpdateOperation',
  ]) {
    jest.spyOn(service, name).mockResolvedValue(undefined);
  }
  return service;
}

describe('GranularPermissionsUtilService — resource ids stay inside the caller workspace', () => {
  const granular = { id: 'gp-1', groupId: 'g-1', type: ResourceType.APP } as any;
  let manager: ReturnType<typeof makeManager>;
  let service: any;

  beforeEach(() => {
    manager = makeManager();
    service = makeService();
  });

  describe('create', () => {
    it('adds apps that belong to the workspace', async () => {
      await service.createAppGroupPermission(
        ORG,
        granular,
        { canEdit: true, resourcesToAdd: [{ appId: 'a-own' }] },
        manager
      );

      expect(manager.insert).toHaveBeenCalledWith(GroupApps, [{ appId: 'a-own', appsGroupPermissionsId: 'agp-1' }]);
    });

    it('rejects an app from another workspace and writes nothing', async () => {
      await expect(
        service.createAppGroupPermission(
          ORG,
          granular,
          { canEdit: true, resourcesToAdd: [{ appId: 'a-own' }, { appId: 'a-foreign' }] },
          manager
        )
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(manager.insert).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rejects a folder from another workspace and writes nothing', async () => {
      await expect(
        service.createFolderGroupPermission(
          ORG,
          { ...granular, type: ResourceType.FOLDER },
          { canEditFolder: true, resourcesToAdd: [{ folderId: 'f-foreign' }] },
          manager
        )
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(manager.insert).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateApps = (extra: object) =>
      service.updateAppsGroupPermission(
        { granularPermissions: granular, actions: { canEdit: true }, group: {}, allowRoleChange: true, ...extra },
        ORG,
        manager
      );

    it('rejects adding an app from another workspace', async () => {
      await expect(updateApps({ resourcesToAdd: [{ appId: 'a-foreign' }] })).rejects.toBeInstanceOf(
        BadRequestException
      );

      expect(manager.save).not.toHaveBeenCalled();
    });

    it('deletes app rows only inside the permission being edited', async () => {
      await updateApps({ resourcesToDelete: [{ id: 'ga-1' }, { id: 'ga-foreign' }] });

      expect(manager.delete).toHaveBeenCalledWith(GroupApps, {
        id: In(['ga-1', 'ga-foreign']),
        appsGroupPermissionsId: 'agp-1',
      });
    });

    it('deletes folder rows only inside the permission being edited', async () => {
      await service.updateFoldersGroupPermission(
        {
          granularPermissions: { ...granular, type: ResourceType.FOLDER, foldersGroupPermissions: { id: 'fgp-1' } },
          resourcesToDelete: [{ id: 'gf-1' }, { id: 'gf-foreign' }],
        },
        ORG,
        manager
      );

      expect(manager.delete).toHaveBeenCalledWith(GroupFolders, {
        id: In(['gf-1', 'gf-foreign']),
        foldersGroupPermissionsId: 'fgp-1',
      });
    });

    it('rejects adding a folder from another workspace', async () => {
      await expect(
        service.updateFoldersGroupPermission(
          {
            granularPermissions: { ...granular, type: ResourceType.FOLDER, foldersGroupPermissions: { id: 'fgp-1' } },
            resourcesToAdd: [{ folderId: 'f-foreign' }],
          },
          ORG,
          manager
        )
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(manager.insert).not.toHaveBeenCalled();
    });
  });
});
