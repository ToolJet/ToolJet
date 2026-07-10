import { INestApplication } from '@nestjs/common';
import { FolderAppsUtilService } from '@ee/folder-apps/util.service';
import { AppVersion } from '@entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { initTestApp, closeTestApp } from 'test-helper';
import {
  createAdmin,
  createApplication,
  createApplicationVersion,
  createFolder,
  addAppToFolder,
  updateEntity,
} from 'test-helper';

/** @group platform */
describe('FolderAppsUtilService.getAppsFor — workflow search (post-migration)', () => {
  let app: INestApplication;
  let folderAppsUtilService: FolderAppsUtilService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    folderAppsUtilService = app.get(FolderAppsUtilService);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should find a workflow in a folder by name, even though apps.name is always null post-migration', async () => {
    const admin = await createAdmin(app, 'folder-workflow-search-admin@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;

    const workflow = await createApplication(app, { user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    await updateEntity(AppVersion, version.id, { appName: 'Findable Workflow Name' });

    const folder = await createFolder(app, { name: 'Workflow Folder', organizationId: admin.workspace.id });
    await addAppToFolder(app, workflow, folder);

    const result = await folderAppsUtilService.getAppsFor(
      admin.user as any,
      folder,
      0,
      'findable',
      APP_TYPES.WORKFLOW
    );

    expect(result.viewableApps.map((a) => a.id)).toContain(workflow.id);
  });
});
