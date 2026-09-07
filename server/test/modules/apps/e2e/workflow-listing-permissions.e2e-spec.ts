import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GroupFolders } from '@entities/group_folders.entity';
import { ResourceType } from '@modules/group-permissions/constants';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createUser,
  login,
  createGroupPermission,
  createUserGroupPermissions,
  createFolder,
  addAppToFolder,
  createWorkflowForUser,
  saveEntity,
} from 'test-helper';

/** @group platform */
describe('GET /apps/:id/workflows — permission-scoped listing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('a builder with folder-scoped view access only sees the workflows in that folder, an admin sees all', async () => {
    const admin = await createAdmin(app, 'workflow-listing-admin@tooljet.io');
    // Plain 'end-user' membership only - the default 'builder'/'admin' groups grant isAll:true
    // on workflows out of the box, which would bypass the folder-scoped grant below and defeat
    // the point of this test (mirrors an org that scoped the builder down to a custom group).
    const { user: builderUser } = await createUser(app, {
      email: 'workflow-listing-builder@tooljet.io',
      groups: ['end-user'],
      organization: admin.workspace,
    });
    const { tokenCookie: builderCookie } = await login(app, 'workflow-listing-builder@tooljet.io', 'password');

    const visibleWorkflow = await createWorkflowForUser(app, admin.user, 'Visible Workflow');
    const hiddenWorkflow = await createWorkflowForUser(app, admin.user, 'Hidden Workflow');

    const group = await createGroupPermission(app, {
      organization: admin.workspace,
      group: 'builder-workflow-group',
    } as any);
    await createUserGroupPermissions(app, builderUser, ['builder-workflow-group']);

    const folder = await createFolder(app, {
      name: 'Visible Workflow Folder',
      type: APP_TYPES.WORKFLOW,
      organizationId: admin.workspace.id,
    });
    await addAppToFolder(app, visibleWorkflow, folder);

    const granular = await saveEntity(GranularPermissions, {
      groupId: group.id,
      name: 'workflow folder view grant',
      type: ResourceType.WORKFLOW_FOLDER,
      isAll: false,
    } as any);
    const folderPerm = await saveEntity(FoldersGroupPermissions, {
      granularPermissionId: granular.id,
      canEditFolder: false,
      canEditApps: false,
      canViewApps: true,
    } as any);
    await saveEntity(GroupFolders, {
      folderId: folder.id,
      foldersGroupPermissionsId: folderPerm.id,
    } as any);

    const builderRes = await request(app.getHttpServer())
      .get(`/api/apps/${visibleWorkflow.id}/workflows`)
      .set('Cookie', builderCookie)
      .set('tj-workspace-id', admin.workspace.id);

    expect(builderRes.status).toBe(200);
    const builderWorkflowIds = builderRes.body.workflows.map((w: any) => w.id);
    expect(builderWorkflowIds).toContain(visibleWorkflow.id);
    expect(builderWorkflowIds).not.toContain(hiddenWorkflow.id);

    const adminRes = await request(app.getHttpServer())
      .get(`/api/apps/${visibleWorkflow.id}/workflows`)
      .set('Cookie', admin.cookie)
      .set('tj-workspace-id', admin.workspace.id);

    expect(adminRes.status).toBe(200);
    const adminWorkflowIds = adminRes.body.workflows.map((w: any) => w.id);
    expect(adminWorkflowIds).toContain(visibleWorkflow.id);
    expect(adminWorkflowIds).toContain(hiddenWorkflow.id);
  });
});
