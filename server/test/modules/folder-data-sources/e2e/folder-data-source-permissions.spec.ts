import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createUser,
  login,
  ensureAppEnvironments,
  getAllEnvironments,
  saveEntity,
  updateEntity,
  findEntityOrFail,
} from 'test-helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GroupFolders } from '@entities/group_folders.entity';
import { ResourceType } from '@modules/group-permissions/constants';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';

/**
 * Permission enforcement for data-source folders + the data sources they contain.
 *
 * The matrix a user is put through:
 *  - folder CRUD on /api/folders (data_source type) is gated by the coarse dataSourceFolderCreate /
 *    dataSourceFolderDelete flags — and MUST stay isolated from the app-folder folderCreate flag.
 *  - moving a data source into / out of a folder (/api/folder-data-sources) is gated by the single
 *    coarse dataSourceFolderCreate flag (the ability grants CREATE+DELETE together), or admin/owner.
 *  - a granular DATA_SOURCE_FOLDER "Edit folder" grant cascades Configure onto the data sources
 *    inside the folder, so it authorizes the per-data-source endpoints (GET by environment) for
 *    exactly those foldered data sources — and nothing outside a folder.
 *
 * Note (EE behaviour, asserted here): in EE the ability layer resolves the folder→data-source
 * cascade (MODULES.GLOBAL_DATA_SOURCE) but does NOT build a MODULES.DATA_SOURCE_FOLDER bucket, so
 * the /api/folder-data-sources guard falls back to the coarse flag — granular per-folder scoping of
 * those mutations is intentionally not exercised here.
 *
 * @group platform
 */
describe('Data source folders — permission enforcement (EE)', () => {
  let app: INestApplication;
  let orgId: string;
  let org: any; // the shared Organization object, reused so every user lands in one workspace
  let adminCookie: string[];

  // Fixtures seeded once (persist across the suite; per-test mutations roll back via SAVEPOINT).
  let dsFolderedId: string; // a data source placed inside folderX
  let dsStrayId: string; // a data source in no folder
  let folderXId: string; // holds dsFolderedId
  let folderYId: string; // empty folder, used for delete tests
  let envId: string;

  // Cookies for users in custom groups with a specific permission shape.
  let noPermsCookie: string[]; // custom group, no data-source-folder flags
  let coarseCookie: string[]; // custom group, dataSourceFolderCreate = true (grants add/remove + create folder)
  let appFolderOnlyCookie: string[]; // custom group, app-folder folderCreate = true only (isolation)
  let deleteCoarseCookie: string[]; // custom group, dataSourceFolderDelete = true (delete folder)
  let editCascadeCookie: string[]; // custom group, granular DATA_SOURCE_FOLDER canEditFolder (isAll)

  const as = (cookie: string[]) => (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', orgId);
  const agent = () => request(app.getHttpServer());

  const dsOptions = (url: string) => [
    { key: 'url', value: url },
    { key: 'auth_type', value: 'none' },
    { key: 'headers', value: [['', '']] },
    { key: 'ssl_certificate', value: 'none', encrypted: false },
  ];

  // Grants a DATA_SOURCE_FOLDER granular permission to a group — mirrors
  // workflow-folder-permissions.spec.ts's grantWorkflowFolderPermission, just tagged DATA_SOURCE_FOLDER.
  let grantCallCount = 0;
  const grantDataSourceFolderPermission = async (
    groupId: string,
    opts: { folderId?: string; canEditFolder?: boolean; canEditApps?: boolean; canViewApps?: boolean; isAll?: boolean }
  ): Promise<void> => {
    const isAll = opts.isAll ?? !opts.folderId;
    grantCallCount += 1;
    const granular = await saveEntity(GranularPermissions, {
      groupId,
      name: `DS folder permissions ${grantCallCount}`,
      type: ResourceType.DATA_SOURCE_FOLDER,
      isAll,
    } as any);
    const folderPerm = await saveEntity(FoldersGroupPermissions, {
      granularPermissionId: granular.id,
      canEditFolder: opts.canEditFolder ?? false,
      canEditApps: opts.canEditApps ?? false,
      canViewApps: opts.canViewApps ?? false,
    } as any);
    if (opts.folderId && !isAll) {
      await saveEntity(GroupFolders, { folderId: opts.folderId, foldersGroupPermissionsId: folderPerm.id } as any);
    }
  };

  // Creates an end-user-role user in `orgId`, in a fresh custom group, and returns the group + cookie.
  const seedUserInCustomGroup = async (
    email: string,
    groupName: string
  ): Promise<{ groupId: string; cookie: string[] }> => {
    await createUser(app, {
      email,
      firstName: 'ds',
      lastName: 'user',
      groups: ['all_users', groupName],
      organization: org,
    });
    const { tokenCookie } = await login(app, email);
    const group = await findEntityOrFail(GroupPermissions, { name: groupName, organizationId: orgId });
    return { groupId: group.id, cookie: tokenCookie };
  };

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));

    const { organization } = await createUser(app, {
      email: 'ds-folder-admin@tooljet.io',
      firstName: 'ds',
      lastName: 'admin',
      groups: ['all_users', 'admin'],
    });
    org = organization;
    orgId = organization.id;
    await ensureAppEnvironments(app, orgId);
    ({ tokenCookie: adminCookie } = await login(app, 'ds-folder-admin@tooljet.io'));
    envId = (await getAllEnvironments(app, orgId))[0].id;

    // Two data sources + two data-source folders, one data source moved into folderX (all as admin).
    dsFolderedId = (
      await as(adminCookie)(agent().post('/api/data-sources'))
        .send({
          name: 'ds-foldered',
          kind: 'restapi',
          options: dsOptions('http://foldered.example.com'),
          scope: 'global',
        })
        .expect(201)
    ).body.id;
    dsStrayId = (
      await as(adminCookie)(agent().post('/api/data-sources'))
        .send({ name: 'ds-stray', kind: 'restapi', options: dsOptions('http://stray.example.com'), scope: 'global' })
        .expect(201)
    ).body.id;
    folderXId = (
      await as(adminCookie)(agent().post('/api/folders'))
        .send({ name: 'ds-folder-x', type: DATA_SOURCE_FOLDER_TYPE })
        .expect(201)
    ).body.id;
    folderYId = (
      await as(adminCookie)(agent().post('/api/folders'))
        .send({ name: 'ds-folder-y', type: DATA_SOURCE_FOLDER_TYPE })
        .expect(201)
    ).body.id;
    await as(adminCookie)(agent().post('/api/folder-data-sources'))
      .send({ folder_id: folderXId, data_source_id: dsFolderedId })
      .expect(201);

    // Users with distinct permission shapes.
    ({ cookie: noPermsCookie } = await seedUserInCustomGroup('ds-noperms@tooljet.io', 'ds-noperms'));

    const coarse = await seedUserInCustomGroup('ds-coarse@tooljet.io', 'ds-coarse');
    await updateEntity(GroupPermissions, coarse.groupId, {
      dataSourceFolderCreate: true,
      dataSourceFolderDelete: true,
    });
    coarseCookie = coarse.cookie;

    const appOnly = await seedUserInCustomGroup('ds-appfolder@tooljet.io', 'ds-appfolder');
    await updateEntity(GroupPermissions, appOnly.groupId, { folderCreate: true, folderDelete: true });
    appFolderOnlyCookie = appOnly.cookie;

    const del = await seedUserInCustomGroup('ds-delete@tooljet.io', 'ds-delete');
    await updateEntity(GroupPermissions, del.groupId, { dataSourceFolderDelete: true });
    deleteCoarseCookie = del.cookie;

    const edit = await seedUserInCustomGroup('ds-edit@tooljet.io', 'ds-edit');
    await grantDataSourceFolderPermission(edit.groupId, { canEditFolder: true, isAll: true });
    editCascadeCookie = edit.cookie;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /api/folders | Create a data-source folder', () => {
    it('should 403 for a group with no data-source-folder create flag', async () => {
      await as(noPermsCookie)(agent().post('/api/folders'))
        .send({ name: 'blocked-folder', type: DATA_SOURCE_FOLDER_TYPE })
        .expect(403);
    });

    it('should 403 when only the app-folder folderCreate flag is granted (isolation)', async () => {
      await as(appFolderOnlyCookie)(agent().post('/api/folders'))
        .send({ name: 'app-folder-cannot-make-ds-folder', type: DATA_SOURCE_FOLDER_TYPE })
        .expect(403);
    });

    it('should 201 with dataSourceFolderCreate', async () => {
      await as(coarseCookie)(agent().post('/api/folders'))
        .send({ name: 'allowed-folder', type: DATA_SOURCE_FOLDER_TYPE })
        .expect(201);
    });
  });

  describe('DELETE /api/folders/:id | Delete a data-source folder', () => {
    it('should 403 for a group with no data-source-folder delete flag', async () => {
      await as(noPermsCookie)(agent().delete(`/api/folders/${folderYId}`)).expect(403);
    });

    it('should 403 when only the app-folder folderDelete flag is granted (isolation)', async () => {
      await as(appFolderOnlyCookie)(agent().delete(`/api/folders/${folderYId}`)).expect(403);
    });

    it('should 200 with dataSourceFolderDelete', async () => {
      await as(deleteCoarseCookie)(agent().delete(`/api/folders/${folderYId}`)).expect(200);
    });
  });

  describe('POST /api/folder-data-sources | Move a data source into a folder', () => {
    it('should 403 without dataSourceFolderCreate', async () => {
      await as(noPermsCookie)(agent().post('/api/folder-data-sources'))
        .send({ folder_id: folderXId, data_source_id: dsStrayId })
        .expect(403);
    });

    it('should 201 with dataSourceFolderCreate', async () => {
      await as(coarseCookie)(agent().post('/api/folder-data-sources'))
        .send({ folder_id: folderXId, data_source_id: dsStrayId })
        .expect(201);
    });
  });

  describe('PUT /api/folder-data-sources/:folderId | Remove a data source from a folder', () => {
    it('should 403 without the data-source-folder permission', async () => {
      await as(noPermsCookie)(agent().put(`/api/folder-data-sources/${folderXId}`))
        .send({ data_source_id: dsFolderedId })
        .expect(403);
    });

    it('should 200 with dataSourceFolderCreate (the coarse flag grants remove too)', async () => {
      await as(coarseCookie)(agent().put(`/api/folder-data-sources/${folderXId}`))
        .send({ data_source_id: dsFolderedId })
        .expect(200);
    });
  });

  describe('Data-source endpoints — configure cascade from a DATA_SOURCE_FOLDER grant', () => {
    const envPath = (dsId: string) => `/api/data-sources/${dsId}/environment/${envId}`;

    it('should 403 for a user with no grant over the foldered data source', async () => {
      await as(noPermsCookie)(agent().get(envPath(dsFolderedId))).expect(403);
    });

    it('should 200 for a user with DATA_SOURCE_FOLDER "Edit folder" — Configure cascades to the foldered data source', async () => {
      await as(editCascadeCookie)(agent().get(envPath(dsFolderedId))).expect(200);
    });

    it('should 403 for the same user on a data source outside every folder (cascade covers only foldered data sources)', async () => {
      await as(editCascadeCookie)(agent().get(envPath(dsStrayId))).expect(403);
    });
  });
});
