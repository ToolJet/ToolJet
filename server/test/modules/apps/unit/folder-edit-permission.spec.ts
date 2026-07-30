import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  resetDB,
  createUser,
  createApplication,
  createFolder,
  addAppToFolder,
  createGroupPermission,
  createUserGroupPermissions,
  saveEntity,
} from 'test-helper';
import { AppsService } from '@ee/apps/service';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GroupFolders } from '@entities/group_folders.entity';
import { ResourceType } from '@modules/group-permissions/constants';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * AppsService.checkFolderEditPermission — DEV-70 Task 2.
 *
 * The method is called with an `appType` parameter and must branch its
 * ability-service resource query (and the userPermissions key it reads back)
 * on MODULES.FOLDER vs MODULES.WORKFLOW_FOLDER depending on whether the app
 * is a front-end app or a workflow. These tests exercise the real
 * AbilityService + DB (no mocking) via a group's canEditApps scoped
 * granular permission on a folder.
 */
describe('AppsService.checkFolderEditPermission', () => {
  let nestApp: INestApplication;
  let service: AppsService;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    service = nestApp.get<AppsService>(AppsService);
  });

  beforeEach(async () => {
    await resetDB();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  /** Grants canEditApps on `folderId`, tagged with `resourceType`, to `groupId`. */
  async function grantFolderEditApps(groupId: string, folderId: string, resourceType: ResourceType): Promise<void> {
    const granular = await saveEntity(GranularPermissions, {
      groupId,
      name: 'Folder edit-apps grant',
      type: resourceType,
      isAll: false,
    } as any);
    const folderPerm = await saveEntity(FoldersGroupPermissions, {
      granularPermissionId: granular.id,
      canViewApps: true,
      canEditApps: true,
      canEditFolder: false,
    } as any);
    await saveEntity(GroupFolders, {
      folderId,
      foldersGroupPermissionsId: folderPerm.id,
    } as any);
  }

  it('FOLDER (front-end): grants edit when the app sits in a folder the group can canEditApps on', async () => {
    const { user, organization } = await createUser(nestApp, {
      email: 'fe-editor@tooljet.io',
      groups: ['all_users'],
    });
    const group = await createGroupPermission(nestApp, { organization, group: 'fe-folder-editors' } as any);
    await createUserGroupPermissions(nestApp, user, ['fe-folder-editors']);

    const folder = await createFolder(nestApp, {
      name: 'FE Folder',
      type: APP_TYPES.FRONT_END,
      organizationId: organization.id,
    });
    const app = await createApplication(nestApp, { name: 'FE App', user, type: APP_TYPES.FRONT_END });
    await addAppToFolder(nestApp, app, folder);

    await grantFolderEditApps(group.id, folder.id, ResourceType.FOLDER);

    const result = await (service as any).checkFolderEditPermission(app.id, user, APP_TYPES.FRONT_END);
    expect(result).toBe(true);
  });

  it('FOLDER (front-end): denies edit without the folder-scoped grant', async () => {
    const { user, organization } = await createUser(nestApp, {
      email: 'fe-no-perm@tooljet.io',
      groups: ['all_users'],
    });

    const folder = await createFolder(nestApp, {
      name: 'FE Folder 2',
      type: APP_TYPES.FRONT_END,
      organizationId: organization.id,
    });
    const app = await createApplication(nestApp, { name: 'FE App 2', user, type: APP_TYPES.FRONT_END });
    await addAppToFolder(nestApp, app, folder);

    const result = await (service as any).checkFolderEditPermission(app.id, user, APP_TYPES.FRONT_END);
    expect(result).toBe(false);
  });

  it('WORKFLOW_FOLDER (parallel case): grants edit when the workflow sits in a workflow-folder the group can canEditApps on', async () => {
    const { user, organization } = await createUser(nestApp, {
      email: 'wf-editor@tooljet.io',
      groups: ['all_users'],
    });
    const group = await createGroupPermission(nestApp, { organization, group: 'wf-folder-editors' } as any);
    await createUserGroupPermissions(nestApp, user, ['wf-folder-editors']);

    const folder = await createFolder(nestApp, {
      name: 'Workflow Folder',
      type: APP_TYPES.WORKFLOW,
      organizationId: organization.id,
    });
    const app = await createApplication(nestApp, { name: 'Workflow App', user, type: APP_TYPES.WORKFLOW });
    await addAppToFolder(nestApp, app, folder);

    await grantFolderEditApps(group.id, folder.id, ResourceType.WORKFLOW_FOLDER);

    const result = await (service as any).checkFolderEditPermission(app.id, user, APP_TYPES.WORKFLOW);
    expect(result).toBe(true);
  });

  it('WORKFLOW_FOLDER (parallel case): denies edit without the folder-scoped grant', async () => {
    const { user, organization } = await createUser(nestApp, {
      email: 'wf-no-perm@tooljet.io',
      groups: ['all_users'],
    });

    const folder = await createFolder(nestApp, {
      name: 'Workflow Folder 2',
      type: APP_TYPES.WORKFLOW,
      organizationId: organization.id,
    });
    const app = await createApplication(nestApp, { name: 'Workflow App 2', user, type: APP_TYPES.WORKFLOW });
    await addAppToFolder(nestApp, app, folder);

    const result = await (service as any).checkFolderEditPermission(app.id, user, APP_TYPES.WORKFLOW);
    expect(result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Isolation: a FOLDER-tagged (App-folder) grant must not leak into the
  // WORKFLOW_FOLDER bucket, and vice versa — even when both are scoped to the
  // very same folder id. This is the scenario the appType branch guards
  // against: resource-type separation is enforced by the GranularPermissions
  // `type` tag, not by the Folder entity's own `type` column.
  // -------------------------------------------------------------------------
  describe('isolation between FOLDER and WORKFLOW_FOLDER resource types', () => {
    it('a WORKFLOW_FOLDER-tagged grant on a folder does not grant FOLDER (front-end) edit access on the same folder id', async () => {
      const { user, organization } = await createUser(nestApp, {
        email: 'isolation-fe@tooljet.io',
        groups: ['all_users'],
      });
      const group = await createGroupPermission(nestApp, { organization, group: 'isolation-fe-group' } as any);
      await createUserGroupPermissions(nestApp, user, ['isolation-fe-group']);

      const folder = await createFolder(nestApp, {
        name: 'Isolation FE Folder',
        type: APP_TYPES.FRONT_END,
        organizationId: organization.id,
      });
      const app = await createApplication(nestApp, { name: 'Isolation FE App', user, type: APP_TYPES.FRONT_END });
      await addAppToFolder(nestApp, app, folder);

      // Misconfigured/foreign grant: WORKFLOW_FOLDER type tag, scoped to a front-end folder's id.
      await grantFolderEditApps(group.id, folder.id, ResourceType.WORKFLOW_FOLDER);

      const result = await (service as any).checkFolderEditPermission(app.id, user, APP_TYPES.FRONT_END);
      expect(result).toBe(false);
    });

    it('a FOLDER-tagged grant on a folder does not grant WORKFLOW_FOLDER edit access on the same folder id', async () => {
      const { user, organization } = await createUser(nestApp, {
        email: 'isolation-wf@tooljet.io',
        groups: ['all_users'],
      });
      const group = await createGroupPermission(nestApp, { organization, group: 'isolation-wf-group' } as any);
      await createUserGroupPermissions(nestApp, user, ['isolation-wf-group']);

      const folder = await createFolder(nestApp, {
        name: 'Isolation Workflow Folder',
        type: APP_TYPES.WORKFLOW,
        organizationId: organization.id,
      });
      const app = await createApplication(nestApp, { name: 'Isolation Workflow App', user, type: APP_TYPES.WORKFLOW });
      await addAppToFolder(nestApp, app, folder);

      // Misconfigured/foreign grant: FOLDER type tag, scoped to a workflow folder's id.
      await grantFolderEditApps(group.id, folder.id, ResourceType.FOLDER);

      const result = await (service as any).checkFolderEditPermission(app.id, user, APP_TYPES.WORKFLOW);
      expect(result).toBe(false);
    });
  });
});
