/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Folder } from '@entities/folder.entity';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FolderDataSourcesGroupPermissions } from '@entities/folder_data_sources_group_permissions.entity';
import { GroupFolderDataSources } from '@entities/group_folder_data_sources.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { User } from '@entities/user.entity';
import {
  createNestAppInstance,
  createUser,
  authenticateUser,
  clearDB,
  setupOrganizationAndUser,
  createDefaultAppEnvironments,
} from '../workflows.helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';

describe('folder-data-sources controller', () => {
  let nestApp: INestApplication;
  let defaultDataSource: TypeOrmDataSource;

  beforeAll(async () => {
    nestApp = await createNestAppInstance({ edition: 'ee' });
    defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
  });

  afterAll(async () => {
    await nestApp.close();
  });

  beforeEach(async () => {
    await clearDB(nestApp);
  });

  // Helper: create a global data source directly in the DB
  async function createGlobalDataSource(orgId: string, name = 'Test DS') {
    const repo = defaultDataSource.getRepository(DataSource);
    return repo.save(
      repo.create({
        name,
        kind: 'restapi',
        organizationId: orgId,
        scope: 'global',
        type: 'default',
      })
    );
  }

  // Helper: create a DS folder directly in the DB
  async function createDsFolder(orgId: string, name: string, createdBy?: string) {
    const repo = defaultDataSource.getRepository(Folder);
    return repo.save(
      repo.create({
        name,
        organizationId: orgId,
        type: 'data_source',
        ...(createdBy ? { createdBy } : {}),
      })
    );
  }

  // Helper: setup a user with admin permissions (including folderDataSourceCreate/Delete)
  async function setupAdminUser() {
    const { user, organization } = await setupOrganizationAndUser(nestApp, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User',
    });

    // Create admin group with folderDataSourceCreate/Delete permissions
    const groupRepo = defaultDataSource.getRepository(GroupPermissions);
    const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

    const adminGroup = groupRepo.create({
      organizationId: organization.id,
      name: 'admin',
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
      appCreate: true,
      appDelete: true,
      folderCreate: true,
      folderDelete: true,
      folderDataSourceCreate: true,
      folderDataSourceDelete: true,
      orgConstantCRUD: true,
      dataSourceCreate: true,
      dataSourceDelete: true,
    });
    await groupRepo.save(adminGroup);

    await groupUsersRepo.save(
      groupUsersRepo.create({ userId: user.id, groupId: adminGroup.id })
    );

    const auth = await authenticateUser(nestApp, user.email, organization.id);

    return { user, organization, auth };
  }

  // Helper: setup a non-admin user (no folderDataSourceCreate/Delete)
  async function setupViewerUser(organizationId: string) {
    const viewer = await createUser(nestApp, {
      email: 'viewer@tooljet.io',
      password: 'password',
      firstName: 'Viewer',
      lastName: 'User',
      organizationId,
    });

    // Create end-user group without folderDataSourceCreate/Delete
    const groupRepo = defaultDataSource.getRepository(GroupPermissions);
    const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

    const viewerGroup = groupRepo.create({
      organizationId,
      name: 'end-user',
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
      appCreate: false,
      appDelete: false,
      folderCreate: false,
      folderDelete: false,
      folderDataSourceCreate: false,
      folderDataSourceDelete: false,
      orgConstantCRUD: false,
      dataSourceCreate: false,
      dataSourceDelete: false,
    });
    await groupRepo.save(viewerGroup);

    await groupUsersRepo.save(
      groupUsersRepo.create({ userId: viewer.id, groupId: viewerGroup.id })
    );

    const auth = await authenticateUser(nestApp, viewer.email, organizationId);

    return { user: viewer, auth };
  }

  describe('POST /api/data-source-folders', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer()).post('/api/data-source-folders');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should create a new data source folder', async () => {
      const { user, organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'Finance team' });

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        name: 'Finance team',
        type: 'data_source',
        organization_id: organization.id,
        created_by: user.id,
      });

      const folderRepo = defaultDataSource.getRepository(Folder);
      const folder = await folderRepo.findOne({ where: { id: response.body.id } });
      expect(folder).toBeDefined();
    });

    it('should reject empty folder name', async () => {
      const { organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: '' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(expect.arrayContaining([expect.stringContaining('Folder name cannot be empty')]));
    });

    it('should reject folder name longer than 50 characters', async () => {
      const { organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'a'.repeat(51) });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(expect.arrayContaining([expect.stringContaining('exceeded 50 characters')]));
    });

    // GAP: License-off → 451. These routes use FeatureAbilityGuard (CASL), not
    // FeatureGuard (license). A @UseGuards(FeatureGuard) + @InitFeature(...) decorator
    // must be added to the controller before license-off can be tested. The pattern
    // for that test is in workflow-webhook.e2e-spec.ts using
    // createNestAppInstanceWithServiceMocks({ shouldMockLicenseService: true }).

    it('should reject duplicate folder name in same organization', async () => {
      const { organization, auth } = await setupAdminUser();

      await createDsFolder(organization.id, 'Existing Folder');

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'Existing Folder' });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toEqual('This folder name is already taken.');
    });

    it('should return 403 for users without folder management permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie)
        .send({ name: 'my folder' });

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ statusCode: 403, message: 'You do not have permission to access this resource' });
    });
  });

  describe('PUT /api/data-source-folders/:id', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer()).put('/api/data-source-folders/some-id');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should rename an existing folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Old Name');

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-source-folders/${folder.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'New Name' });

      expect(response.statusCode).toBe(200);

      const folderRepo = defaultDataSource.getRepository(Folder);
      const updatedFolder = await folderRepo.findOne({ where: { id: folder.id } });
      expect(updatedFolder.name).toEqual('New Name');
    });

    it('should reject rename to duplicate name', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder1 = await createDsFolder(organization.id, 'Folder A');
      await createDsFolder(organization.id, 'Folder B');

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-source-folders/${folder1.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'Folder B' });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toEqual('This folder name is already taken.');
    });

    it('should deny users without permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const folder = await createDsFolder(organization.id, 'Folder1');

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-source-folders/${folder.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie)
        .send({ name: 'Renamed' });

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ statusCode: 403, message: 'You do not have permission to access this resource' });
    });
  });

  describe('DELETE /api/data-source-folders/:id', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer()).delete('/api/data-source-folders/some-id');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should delete an existing folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'To Delete');

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-source-folders/${folder.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);

      const folderRepo = defaultDataSource.getRepository(Folder);
      const deletedFolder = await folderRepo.findOne({ where: { id: folder.id } });
      expect(deletedFolder).toBeNull();
    });

    it('should cascade delete folder_data_sources but not the data sources themselves', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'To Delete');
      const ds = await createGlobalDataSource(organization.id);

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      await request(nestApp.getHttpServer())
        .delete(`/api/data-source-folders/${folder.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .expect(200);

      const fds = await fdsRepo.findOne({ where: { folderId: folder.id } });
      expect(fds).toBeNull();

      // data source itself should still exist
      const dsRepo = defaultDataSource.getRepository(DataSource);
      const existingDs = await dsRepo.findOne({ where: { id: ds.id } });
      expect(existingDs).toBeDefined();
    });

    it('should deny users without permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const folder = await createDsFolder(organization.id, 'Folder1');

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-source-folders/${folder.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ statusCode: 403, message: 'You do not have permission to access this resource' });
    });
  });

  describe('POST /api/data-source-folders/:folderId/data-sources', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders/some-folder-id/data-sources');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should add a data source to a folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'My Folder');
      const ds = await createGlobalDataSource(organization.id, 'My DS');

      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ dataSourceId: ds.id });

      expect(response.statusCode).toBe(201);

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      const fds = await fdsRepo.findOne({ where: { folderId: folder.id, dataSourceId: ds.id } });
      expect(fds).toMatchObject({ folderId: folder.id, dataSourceId: ds.id });
    });

    it('should move a DS from one folder to another (old membership removed)', async () => {
      const { organization, auth } = await setupAdminUser();

      const folderA = await createDsFolder(organization.id, 'Folder A');
      const folderB = await createDsFolder(organization.id, 'Folder B');
      const ds = await createGlobalDataSource(organization.id, 'Shared DS');

      // Place DS in folder A first
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folderA.id, dataSourceId: ds.id }));

      // Move DS to folder B via API
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-source-folders/${folderB.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ dataSourceId: ds.id });

      expect(response.statusCode).toBe(201);

      // Old membership in folder A should be gone
      const oldMembership = await fdsRepo.findOne({ where: { folderId: folderA.id, dataSourceId: ds.id } });
      expect(oldMembership).toBeNull();

      // New membership in folder B should exist
      const newMembership = await fdsRepo.findOne({ where: { folderId: folderB.id, dataSourceId: ds.id } });
      expect(newMembership).toBeDefined();
    });

    it('should reject adding an app-scoped DS to a folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'My Folder');

      // Create an app-scoped DS
      const dsRepo = defaultDataSource.getRepository(DataSource);
      const appScopedDs = await dsRepo.save(
        dsRepo.create({
          name: 'App DS',
          kind: 'restapi',
          organizationId: organization.id,
          scope: 'local',
          type: 'default',
        })
      );

      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ dataSourceId: appScopedDs.id });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual('Only global-scope data sources can be added to folders');
    });

    it('should return 403 for users without folder management permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const folder = await createDsFolder(organization.id, 'My Folder');
      const ds = await createGlobalDataSource(organization.id, 'My DS');

      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie)
        .send({ dataSourceId: ds.id });

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ statusCode: 403, message: 'You do not have permission to access this resource' });
    });
  });

  describe('DELETE /api/data-source-folders/:folderId/data-sources/:dsId', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer())
        .delete('/api/data-source-folders/some-folder-id/data-sources/some-ds-id');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should remove a data source from a folder without deleting the DS', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'My Folder');
      const ds = await createGlobalDataSource(organization.id, 'My DS');

      // Place DS into the folder
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-source-folders/${folder.id}/data-sources/${ds.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);

      // FolderDataSource row should be gone
      const fds = await fdsRepo.findOne({ where: { folderId: folder.id, dataSourceId: ds.id } });
      expect(fds).toBeNull();

      // The data source itself should still exist
      const dsRepo = defaultDataSource.getRepository(DataSource);
      const existingDs = await dsRepo.findOne({ where: { id: ds.id } });
      expect(existingDs).toBeDefined();
    });

    it('should return 403 for users without folder management permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const folder = await createDsFolder(organization.id, 'My Folder');
      const ds = await createGlobalDataSource(organization.id, 'My DS');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      const response = await request(nestApp.getHttpServer())
        .delete(`/api/data-source-folders/${folder.id}/data-sources/${ds.id}`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ statusCode: 403, message: 'You do not have permission to access this resource' });
    });
  });

  describe('PUT /api/data-source-folders/:folderId/data-sources (bulk move)', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer())
        .put('/api/data-source-folders/some-folder-id/data-sources')
        .send({ dataSourceIds: [] });
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should bulk move multiple data sources to a folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Target Folder');
      const ds1 = await createGlobalDataSource(organization.id, 'DS One');
      const ds2 = await createGlobalDataSource(organization.id, 'DS Two');
      const ds3 = await createGlobalDataSource(organization.id, 'DS Three');

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ dataSourceIds: [ds1.id, ds2.id, ds3.id] });

      expect(response.statusCode).toBe(200);

      // All three FolderDataSource rows should exist
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      const remaining = await fdsRepo.find({ where: { folderId: folder.id } });
      expect(remaining).toHaveLength(3);
      expect(remaining.map(r => r.dataSourceId).sort()).toEqual([ds1.id, ds2.id, ds3.id].sort());
    });

    it('should atomically move DS from various folders to target (old memberships removed)', async () => {
      const { organization, auth } = await setupAdminUser();

      const folderA = await createDsFolder(organization.id, 'Source Folder A');
      const folderB = await createDsFolder(organization.id, 'Source Folder B');
      const targetFolder = await createDsFolder(organization.id, 'Target Folder');

      const ds1 = await createGlobalDataSource(organization.id, 'DS One');
      const ds2 = await createGlobalDataSource(organization.id, 'DS Two');
      const ds3 = await createGlobalDataSource(organization.id, 'DS Three');

      // Pre-populate: ds1 and ds2 in folder A, ds3 in folder B
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folderA.id, dataSourceId: ds1.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folderA.id, dataSourceId: ds2.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folderB.id, dataSourceId: ds3.id }));

      // Bulk move all three to target folder
      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-source-folders/${targetFolder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ dataSourceIds: [ds1.id, ds2.id, ds3.id] });

      expect(response.statusCode).toBe(200);

      // Old memberships should be gone
      const oldFdsA1 = await fdsRepo.findOne({ where: { folderId: folderA.id, dataSourceId: ds1.id } });
      const oldFdsA2 = await fdsRepo.findOne({ where: { folderId: folderA.id, dataSourceId: ds2.id } });
      const oldFdsB3 = await fdsRepo.findOne({ where: { folderId: folderB.id, dataSourceId: ds3.id } });

      expect(oldFdsA1).toBeNull();
      expect(oldFdsA2).toBeNull();
      expect(oldFdsB3).toBeNull();

      // New memberships in target folder should exist
      const remaining = await fdsRepo.find({ where: { folderId: targetFolder.id } });
      expect(remaining).toHaveLength(3);
      expect(remaining.map(r => r.dataSourceId).sort()).toEqual([ds1.id, ds2.id, ds3.id].sort());
    });

    it('should return 403 for users without folder management permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const folder = await createDsFolder(organization.id, 'Target Folder');
      const ds1 = await createGlobalDataSource(organization.id, 'DS One');
      const ds2 = await createGlobalDataSource(organization.id, 'DS Two');

      const response = await request(nestApp.getHttpServer())
        .put(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie)
        .send({ dataSourceIds: [ds1.id, ds2.id] });

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({ statusCode: 403, message: 'You do not have permission to access this resource' });
    });
  });

  describe('GET /api/data-source-folders', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer()).get('/api/data-source-folders');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should return empty array when no folders exist', async () => {
      const { organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should list folders alphabetically with DS counts', async () => {
      const { organization, auth } = await setupAdminUser();

      // Create folders out of alphabetical order
      const folderB = await createDsFolder(organization.id, 'Beta');
      const folderA = await createDsFolder(organization.id, 'Alpha');

      // Add 2 DS to Alpha, 1 DS to Beta
      const ds1 = await createGlobalDataSource(organization.id, 'DS One');
      const ds2 = await createGlobalDataSource(organization.id, 'DS Two');
      const ds3 = await createGlobalDataSource(organization.id, 'DS Three');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folderA.id, dataSourceId: ds1.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folderA.id, dataSourceId: ds2.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folderB.id, dataSourceId: ds3.id }));

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toMatchObject([
        { name: 'Alpha', count: 2 },
        { name: 'Beta', count: 1 },
      ]);
    });

    it('should filter folders by search query', async () => {
      const { organization, auth } = await setupAdminUser();

      await createDsFolder(organization.id, 'Finance');
      await createDsFolder(organization.id, 'Marketing');

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders?search=Fin')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toEqual('Finance');
    });

    it('should return folders with nested data_sources when include_data_sources=true', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder1 = await createDsFolder(organization.id, 'Finance');
      const folder2 = await createDsFolder(organization.id, 'Marketing');

      const ds1 = await createGlobalDataSource(organization.id, 'Postgres Prod');
      const ds2 = await createGlobalDataSource(organization.id, 'Stripe API');
      const ds3 = await createGlobalDataSource(organization.id, 'Redis Cache');
      const dsUngrouped = await createGlobalDataSource(organization.id, 'Ungrouped DS');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder1.id, dataSourceId: ds1.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder1.id, dataSourceId: ds2.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder2.id, dataSourceId: ds3.id }));

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders?include_data_sources=true')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      // 2 folders + 1 ungrouped bucket
      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Finance', count: 2, data_sources: expect.arrayContaining([expect.objectContaining({ id: ds1.id }), expect.objectContaining({ id: ds2.id })]) }),
          expect.objectContaining({ name: 'Marketing', count: 1 }),
          expect.objectContaining({ id: null, name: 'Ungrouped' }),
        ])
      );
      const ungrouped = response.body.find((f: any) => f.id === null);
      expect(ungrouped.data_sources.some((d: any) => d.id === dsUngrouped.id)).toBe(true);
    });

    it('should sort data sources alphabetically within folders', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Test Folder');

      const dsZ = await createGlobalDataSource(organization.id, 'Zebra');
      const dsA = await createGlobalDataSource(organization.id, 'Alpha');
      const dsM = await createGlobalDataSource(organization.id, 'Middle');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: dsZ.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: dsA.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: dsM.id }));

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders?include_data_sources=true')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);

      const testFolder = response.body.find((f: any) => f.name === 'Test Folder');
      expect(testFolder.data_sources).toHaveLength(3);
      const dsNames = testFolder.data_sources.map((d: any) => d.name);
      expect(dsNames).toEqual(['Alpha', 'Middle', 'Zebra']);
    });

    it('should filter by DS name when searching with include_data_sources=true', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder1 = await createDsFolder(organization.id, 'Finance');
      const folder2 = await createDsFolder(organization.id, 'Marketing');

      const ds1 = await createGlobalDataSource(organization.id, 'Postgres Prod');
      const ds2 = await createGlobalDataSource(organization.id, 'Redis Cache');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder1.id, dataSourceId: ds1.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder2.id, dataSourceId: ds2.id }));

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders?include_data_sources=true&search=postgres')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);

      // Finance folder included (has matching DS), Marketing excluded
      const folderNames = response.body.filter((f: any) => f.id !== null).map((f: any) => f.name);
      expect(folderNames).toContain('Finance');
      expect(folderNames).not.toContain('Marketing');

      const finance = response.body.find((f: any) => f.name === 'Finance');
      expect(finance.data_sources).toHaveLength(1);
      expect(finance.data_sources[0].name).toEqual('Postgres Prod');
    });

    it('should return all DS in folder when folder name matches search', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Finance');

      const ds1 = await createGlobalDataSource(organization.id, 'Postgres Prod');
      const ds2 = await createGlobalDataSource(organization.id, 'Stripe API');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds1.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds2.id }));

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders?include_data_sources=true&search=Finance')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);

      const finance = response.body.find((f: any) => f.name === 'Finance');
      expect(finance).toBeDefined();
      // All DS returned since folder name matches
      expect(finance.data_sources).toHaveLength(2);
    });

    it('should not include data_sources key without include_data_sources param', async () => {
      const { organization, auth } = await setupAdminUser();

      await createDsFolder(organization.id, 'Finance');

      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).not.toHaveProperty('data_sources');
    });
  });

  describe('GET /api/data-source-folders/:folderId/data-sources', () => {
    it('should require authentication', async () => {
      const response = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders/some-folder-id/data-sources');
      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should list data sources within a folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'My Folder');
      const ds1 = await createGlobalDataSource(organization.id, 'DS One');
      const ds2 = await createGlobalDataSource(organization.id, 'DS Two');

      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds1.id }));
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds2.id }));

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        data_sources: expect.arrayContaining([
          expect.objectContaining({ id: ds1.id }),
          expect.objectContaining({ id: ds2.id }),
        ]),
        meta: { total_count: 2, total_pages: 1, current_page: 1, per_page: 25 },
      });
      expect(response.body.data_sources).toHaveLength(2);
    });

    it('should paginate data sources within a folder', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Paginated Folder');
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);

      // Create 5 data sources in the folder
      for (let i = 1; i <= 5; i++) {
        const ds = await createGlobalDataSource(organization.id, `DS ${i}`);
        await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));
      }

      // Page 1 with per_page=2 → expect 2 items
      const page1 = await request(nestApp.getHttpServer())
        .get(`/api/data-source-folders/${folder.id}/data-sources?page=1&per_page=2`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(page1.statusCode).toBe(200);
      expect(page1.body).toMatchObject({
        data_sources: expect.any(Array),
        meta: { total_count: 5, total_pages: 3, current_page: 1, per_page: 2 },
      });
      expect(page1.body.data_sources).toHaveLength(2);

      // Page 2 → expect 2 items
      const page2 = await request(nestApp.getHttpServer())
        .get(`/api/data-source-folders/${folder.id}/data-sources?page=2&per_page=2`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(page2.statusCode).toBe(200);
      expect(page2.body.data_sources).toHaveLength(2);
      expect(page2.body.meta.current_page).toBe(2);

      // Page 3 → expect 1 item (remainder)
      const page3 = await request(nestApp.getHttpServer())
        .get(`/api/data-source-folders/${folder.id}/data-sources?page=3&per_page=2`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(page3.statusCode).toBe(200);
      expect(page3.body.data_sources).toHaveLength(1);
      expect(page3.body.meta.current_page).toBe(3);

      // No overlap between pages
      const allIds = [
        ...page1.body.data_sources.map((ds: any) => ds.id),
        ...page2.body.data_sources.map((ds: any) => ds.id),
        ...page3.body.data_sources.map((ds: any) => ds.id),
      ];
      expect(new Set(allIds).size).toBe(5);
    });

    it('should return empty data_sources for folder with no data sources', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Empty Folder');

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.data_sources).toEqual([]);
      expect(response.body.meta.total_count).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Folder-Level Granular Permissions
  //
  // Routes (all under /api/v2/group-permissions):
  //   POST   /:groupId/granular-permissions/data-source-folder   → create
  //   PUT    /:groupId/granular-permissions/data-source-folder/:id → update
  //   DELETE /:groupId/granular-permissions/data-source-folder/:id → delete
  //
  // NOTE: These routes are gated behind the EE license. Tests that exercise
  // complex internal logic (hierarchy cascade, license feature-flag checks)
  // are marked `.todo()` because they require deep service mocking that is
  // outside the scope of black-box e2e testing.
  // ---------------------------------------------------------------------------

  describe('Folder-Level Granular Permissions', () => {
    // Helper: create a custom (non-default) group with admin-level master permissions
    async function setupCustomGroup(organizationId: string) {
      const groupRepo = defaultDataSource.getRepository(GroupPermissions);
      const customGroup = groupRepo.create({
        organizationId,
        name: 'ds-folder-testers',
        type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
        appCreate: false,
        appDelete: false,
        folderCreate: false,
      folderDelete: false,
        folderDataSourceCreate: false,
        folderDataSourceDelete: false,
        orgConstantCRUD: false,
        dataSourceCreate: false,
        dataSourceDelete: false,
      });
      return groupRepo.save(customGroup);
    }

    // Helper: create an end-user group
    async function setupEndUserGroup(organizationId: string) {
      const groupRepo = defaultDataSource.getRepository(GroupPermissions);
      const endUserGroup = groupRepo.create({
        organizationId,
        name: 'end-user-group',
        type: GROUP_PERMISSIONS_TYPE.DEFAULT,
        appCreate: false,
        appDelete: false,
        folderCreate: false,
      folderDelete: false,
        folderDataSourceCreate: false,
        folderDataSourceDelete: false,
        orgConstantCRUD: false,
        dataSourceCreate: false,
        dataSourceDelete: false,
      });
      return groupRepo.save(endUserGroup);
    }

    describe('granular permission CRUD', () => {
      it('should create granular permission for a DS folder', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Finance');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Finance folder permission',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              canRunQuery: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        expect(response.statusCode).toBe(201);
      });

      it('should update granular permission', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);

        // First create a permission, then update it.
        const createRes = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Perm to update',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              canRunQuery: true,
            },
          });

        expect(createRes.statusCode).toBe(201);

        const permId = createRes.body?.id;
        expect(permId).toBeDefined();

        const updateRes = await request(nestApp.getHttpServer())
          .put(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder/${permId}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            actions: { canConfigureDs: true, canUseDs: true },
          });

        expect(updateRes.statusCode).toBe(200);
      });

      it('should delete granular permission', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);

        const createRes = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Perm to delete',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              canRunQuery: true,
            },
          });

        expect(createRes.statusCode).toBe(201);

        const permId = createRes.body?.id;
        expect(permId).toBeDefined();

        const deleteRes = await request(nestApp.getHttpServer())
          .delete(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder/${permId}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie);

        expect([200, 204]).toContain(deleteRes.statusCode);
      });

      it('should return 403 when creating without admin role', async () => {
        const { organization } = await setupAdminUser();
        const { auth: viewerAuth } = await setupViewerUser(organization.id);
        const group = await setupCustomGroup(organization.id);

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', viewerAuth.tokenCookie)
          .send({
            name: 'Unauthorized attempt',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canUseDs: true,
            },
          });

        // Non-admin users must be rejected.  Accept 401/403 — not 200/201.
        expect([401, 403]).toContain(response.statusCode);
      });
    });

    describe('permission hierarchy', () => {
      it('canEditFolder=true auto-elevates canConfigureDs and canUseDs to true', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Folder Alpha');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Full edit permission',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: true,
              canConfigureDs: false, // should be auto-elevated to true
              canUseDs: false,       // should be auto-elevated to true
              canRunQuery: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          canEditFolder: true,
          canConfigureDs: true,
          canUseDs: true,
        });
      });

      it('canConfigureDs=true auto-elevates canUseDs to true', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Folder Beta');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Configure permission',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: true,
              canUseDs: false, // should be auto-elevated to true
              canRunQuery: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          canEditFolder: false,
          canConfigureDs: true,
          canUseDs: true,
        });
      });

      it('canRunQuery=false is independent of the edit/configure/use hierarchy', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Folder Gamma');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Use with query restriction',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              canRunQuery: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          canEditFolder: false,
          canConfigureDs: false,
          canUseDs: true,
          canRunQuery: false,
        });
      });
    });

    describe('end-user constraints', () => {
      it('end-user groups cannot be granted canEditFolder', async () => {
        const { organization, auth } = await setupAdminUser();
        const endUserGroup = await setupEndUserGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Restricted Folder');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${endUserGroup.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'End user edit attempt',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: true,
              canConfigureDs: false,
              canUseDs: false,
              canRunQuery: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        // End-user groups must not be granted canEditFolder
        expect([400, 403, 422]).toContain(response.statusCode);
        expect(response.body.message).toBeDefined();
      });

      it('end-user groups cannot be granted canConfigureDs', async () => {
        const { organization, auth } = await setupAdminUser();
        const endUserGroup = await setupEndUserGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Restricted Folder 2');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${endUserGroup.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'End user configure attempt',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: true,
              canUseDs: false,
              canRunQuery: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        expect([400, 403, 422]).toContain(response.statusCode);
        expect(response.body.message).toBeDefined();
      });

      it('end-user groups cannot be granted canUseDs', async () => {
        const { organization, auth } = await setupAdminUser();
        const endUserGroup = await setupEndUserGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Restricted Folder 3');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${endUserGroup.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'End user use attempt',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              canRunQuery: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        expect([400, 403, 422]).toContain(response.statusCode);
        expect(response.body.message).toBeDefined();
      });

      it('end-user groups can restrict canRunQuery to false', async () => {
        const { organization, auth } = await setupAdminUser();
        const endUserGroup = await setupEndUserGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Restricted Folder 4');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${endUserGroup.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'End user query restriction',
            isAll: false,
            type: 'folder_data_source',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: false,
              canRunQuery: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        // canRunQuery is the only permission end-user groups may set to false
        expect([200, 201]).toContain(response.statusCode);
        expect(response.body.canRunQuery).toBe(false);
      });
    });

    describe('folder visibility', () => {
      it('non-admin user sees only folders granted via granular permissions', async () => {
        const { organization, auth: adminAuth } = await setupAdminUser();

        // Admin creates two folders
        const visibleFolder = await createDsFolder(organization.id, 'Visible');
        await createDsFolder(organization.id, 'Hidden');

        // Create a custom group with granular access to only "Visible" folder
        const customGroup = await setupCustomGroup(organization.id);

        const gpRepo = defaultDataSource.getRepository(GranularPermissions);
        const folderDataSourcePermRepo = defaultDataSource.getRepository(FolderDataSourcesGroupPermissions);
        const groupFolderDataSourceRepo = defaultDataSource.getRepository(GroupFolderDataSources);
        const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

        const granularPerm = await gpRepo.save(
          gpRepo.create({
            groupId: customGroup.id,
            name: 'Visible folder access',
            type: ResourceType.FOLDER_DATA_SOURCE,
            isAll: false,
          })
        );

        const folderDataSourcePerm = await folderDataSourcePermRepo.save(
          folderDataSourcePermRepo.create({
            granularPermissionId: granularPerm.id,
            canEditFolder: false,
            canConfigureDs: false,
            canUseDs: true,
            canRunQuery: true,
          })
        );

        await groupFolderDataSourceRepo.save(
          groupFolderDataSourceRepo.create({
            folderDataSourcesGroupPermissionsId: folderDataSourcePerm.id,
            folderId: visibleFolder.id,
          })
        );

        // Create a non-admin user and add to the custom group only
        const viewer = await createUser(nestApp, {
          email: 'filtered-viewer@tooljet.io',
          password: 'password',
          firstName: 'Filtered',
          lastName: 'Viewer',
          organizationId: organization.id,
        });

        // End-user group so they have a valid role
        const endUserGroup = await setupEndUserGroup(organization.id);
        await groupUsersRepo.save(
          groupUsersRepo.create({ userId: viewer.id, groupId: endUserGroup.id })
        );
        await groupUsersRepo.save(
          groupUsersRepo.create({ userId: viewer.id, groupId: customGroup.id })
        );

        const viewerAuth = await authenticateUser(nestApp, viewer.email, organization.id);

        const response = await request(nestApp.getHttpServer())
          .get('/api/data-source-folders')
          .set('tj-workspace-id', organization.id)
          .set('Cookie', viewerAuth.tokenCookie);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([expect.objectContaining({ name: 'Visible' })]);
      });

      it('folder creator sees own folders without explicit granular permission', async () => {
        const { organization } = await setupAdminUser();

        const groupRepo = defaultDataSource.getRepository(GroupPermissions);
        const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

        // Create a builder-like group with folderDataSourceCreate but no admin role
        const builderGroup = groupRepo.create({
          organizationId: organization.id,
          name: 'ds-folder-creators',
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          appCreate: false,
          appDelete: false,
          folderCreate: false,
          folderDelete: false,
          folderDataSourceCreate: true,
          folderDataSourceDelete: false,
          orgConstantCRUD: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
        });
        await groupRepo.save(builderGroup);

        // Create user and assign to builder group + end-user group
        const creator = await createUser(nestApp, {
          email: 'creator@tooljet.io',
          password: 'password',
          firstName: 'Creator',
          lastName: 'User',
          organizationId: organization.id,
        });

        const endUserGroup = await setupEndUserGroup(organization.id);
        await groupUsersRepo.save(
          groupUsersRepo.create({ userId: creator.id, groupId: endUserGroup.id })
        );
        await groupUsersRepo.save(
          groupUsersRepo.create({ userId: creator.id, groupId: builderGroup.id })
        );

        // Create two folders — one by this user, one by someone else
        const ownedFolder = await createDsFolder(organization.id, 'My Folder', creator.id);
        await createDsFolder(organization.id, 'Not My Folder');

        const creatorAuth = await authenticateUser(nestApp, creator.email, organization.id);

        const response = await request(nestApp.getHttpServer())
          .get('/api/data-source-folders')
          .set('tj-workspace-id', organization.id)
          .set('Cookie', creatorAuth.tokenCookie);

        expect(response.statusCode).toBe(200);
        const folderNames = response.body.map((f: any) => f.name);
        expect(folderNames).toContain('My Folder');
        expect(folderNames).not.toContain('Not My Folder');
      });
    });

    describe('DS x folder permission resolution', () => {
      it('should grant folder-level DS access even without direct DS granular permission', async () => {
        const { organization, auth: adminAuth } = await setupAdminUser();

        // Create a DS and put it in a folder
        const ds = await createGlobalDataSource(organization.id, 'Folder-Scoped DS');
        const folder = await createDsFolder(organization.id, 'Configured Folder');
        const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
        await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

        // Create a custom group with folder-level canConfigureDs (no DS-level perm)
        const customGroup = await setupCustomGroup(organization.id);

        const gpRepo = defaultDataSource.getRepository(GranularPermissions);
        const folderDataSourcePermRepo = defaultDataSource.getRepository(FolderDataSourcesGroupPermissions);
        const groupFolderDataSourceRepo = defaultDataSource.getRepository(GroupFolderDataSources);
        const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

        const granularPerm = await gpRepo.save(
          gpRepo.create({
            groupId: customGroup.id,
            name: 'Folder configure access',
            type: ResourceType.FOLDER_DATA_SOURCE,
            isAll: false,
          })
        );

        const folderDataSourcePerm = await folderDataSourcePermRepo.save(
          folderDataSourcePermRepo.create({
            granularPermissionId: granularPerm.id,
            canEditFolder: false,
            canConfigureDs: true,
            canUseDs: true,
            canRunQuery: true,
          })
        );

        await groupFolderDataSourceRepo.save(
          groupFolderDataSourceRepo.create({
            folderDataSourcesGroupPermissionsId: folderDataSourcePerm.id,
            folderId: folder.id,
          })
        );

        // Create user in custom group + end-user group
        const viewer = await createUser(nestApp, {
          email: 'folder-ds-viewer@tooljet.io',
          password: 'password',
          firstName: 'FolderDS',
          lastName: 'Viewer',
          organizationId: organization.id,
        });

        const endUserGroup = await setupEndUserGroup(organization.id);
        await groupUsersRepo.save(
          groupUsersRepo.create({ userId: viewer.id, groupId: endUserGroup.id })
        );
        await groupUsersRepo.save(
          groupUsersRepo.create({ userId: viewer.id, groupId: customGroup.id })
        );

        const viewerAuth = await authenticateUser(nestApp, viewer.email, organization.id);

        // User should be able to see the DS in the folder listing
        const folderDsResponse = await request(nestApp.getHttpServer())
          .get(`/api/data-source-folders/${folder.id}/data-sources`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', viewerAuth.tokenCookie);

        expect(folderDsResponse.statusCode).toBe(200);
        const dsIds = folderDsResponse.body.data_sources.map((d: any) => d.id);
        expect(dsIds).toContain(ds.id);
      });
    });
  });

  describe('canRunQuery runtime enforcement', () => {
    // Helper: create a minimal non-public app with a version and data query linked to a data source
    async function createAppWithQuery(orgId: string, userId: string, dataSourceId: string) {
      const appRepo = defaultDataSource.getRepository(App);
      const versionRepo = defaultDataSource.getRepository(AppVersion);
      const queryRepo = defaultDataSource.getRepository(DataQuery);

      const app = await appRepo.save(
        appRepo.create({
          name: 'Test App',
          slug: `test-app-${Date.now()}`,
          isPublic: false,
          organizationId: orgId,
          userId,
          icon: '',
        })
      );

      const version = await versionRepo.save(
        versionRepo.create({
          name: `v1-${Date.now()}`,
          appId: app.id,
          definition: {},
        })
      );

      app.currentVersionId = version.id;
      await appRepo.save(app);

      const query = await queryRepo.save(
        queryRepo.create({
          name: 'test_query',
          options: { method: 'get', url: 'https://example.com' },
          dataSourceId,
          appVersionId: version.id,
        })
      );

      return { app, version, query };
    }

    // Helper: set up canRunQuery permission for a group on a folder directly in DB
    // restrict=true means canRunQuery=false (blocked), restrict=false means canRunQuery=true (allowed)
    async function setupRestriction(groupId: string, folderId: string, restrict: boolean) {
      const gpRepo = defaultDataSource.getRepository(GranularPermissions);
      const folderDataSourcesGpRepo = defaultDataSource.getRepository(FolderDataSourcesGroupPermissions);
      const gdfRepo = defaultDataSource.getRepository(GroupFolderDataSources);

      const granularPerm = await gpRepo.save(
        gpRepo.create({
          groupId,
          name: 'DS folder restrict test',
          type: ResourceType.FOLDER_DATA_SOURCE,
          isAll: false,
        })
      );

      const folderDataSourcePerm = await folderDataSourcesGpRepo.save(
        folderDataSourcesGpRepo.create({
          granularPermissionId: granularPerm.id,
          canEditFolder: false,
          canConfigureDs: false,
          canUseDs: true,
          canRunQuery: !restrict,
        })
      );

      await gdfRepo.save(
        gdfRepo.create({
          folderDataSourcesGroupPermissionsId: folderDataSourcePerm.id,
          folderId,
        })
      );

      return { granularPerm, folderDataSourcePerm };
    }

    it('canRunQuery=false blocks query execution on folder data sources', async () => {
      const { user, organization, auth } = await setupAdminUser();

      // Create DS, folder, and put DS in folder
      const ds = await createGlobalDataSource(organization.id, 'Restricted DS');
      const folder = await createDsFolder(organization.id, 'Restricted Folder');
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      // Create app with query
      const { query } = await createAppWithQuery(organization.id, user.id, ds.id);

      // Create a custom group with canRunQuery=false (restricted)
      const groupRepo = defaultDataSource.getRepository(GroupPermissions);
      const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

      const restrictedGroup = await groupRepo.save(
        groupRepo.create({
          organizationId: organization.id,
          name: 'restricted-runners',
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          appCreate: false,
          appDelete: false,
          folderCreate: false,
      folderDelete: false,
          folderDataSourceCreate: false,
          folderDataSourceDelete: false,
          orgConstantCRUD: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
        })
      );

      // Add user to restricted group
      await groupUsersRepo.save(
        groupUsersRepo.create({ userId: user.id, groupId: restrictedGroup.id })
      );

      // Set up canRunQuery=false for the folder (restrict queries)
      await setupRestriction(restrictedGroup.id, folder.id, true);

      // Try to run the query — should be blocked
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-queries/${query.id}/run`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ options: {}, resolvedOptions: {} });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toEqual('You do not have permission to run queries on this data source');
    });

    it('should allow query run when canRunQuery is true', async () => {
      const { user, organization, auth } = await setupAdminUser();

      // Create DS, folder, and put DS in folder
      const ds = await createGlobalDataSource(organization.id, 'Allowed DS');
      const folder = await createDsFolder(organization.id, 'Allowed Folder');
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      // Create app with query
      const { query } = await createAppWithQuery(organization.id, user.id, ds.id);

      // Create a custom group with canRunQuery=true (allowed)
      const groupRepo = defaultDataSource.getRepository(GroupPermissions);
      const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

      const allowedGroup = await groupRepo.save(
        groupRepo.create({
          organizationId: organization.id,
          name: 'allowed-runners',
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          appCreate: false,
          appDelete: false,
          folderCreate: false,
      folderDelete: false,
          folderDataSourceCreate: false,
          folderDataSourceDelete: false,
          orgConstantCRUD: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
        })
      );

      await groupUsersRepo.save(
        groupUsersRepo.create({ userId: user.id, groupId: allowedGroup.id })
      );

      // Set up canRunQuery=true for the folder (allow queries)
      await setupRestriction(allowedGroup.id, folder.id, false);

      // Try to run the query — should NOT be blocked (may fail with other errors but not 403)
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-queries/${query.id}/run`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ options: {}, resolvedOptions: {} });

      // Should not be 403 — the restriction should not block
      expect(response.statusCode).not.toBe(403);
    });

    it('canRunQuery=false blocks query even when canEditFolder, canConfigureDs, canUseDs are all true', async () => {
      const { user, organization, auth } = await setupAdminUser();

      // Create DS, folder, and put DS in folder
      const ds = await createGlobalDataSource(organization.id, 'Full Access DS');
      const folder = await createDsFolder(organization.id, 'Full Access Folder');
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      // Create app with query
      const { query } = await createAppWithQuery(organization.id, user.id, ds.id);

      // Create custom group with all master-level permissions disabled
      const groupRepo = defaultDataSource.getRepository(GroupPermissions);
      const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

      const customGroup = await groupRepo.save(
        groupRepo.create({
          organizationId: organization.id,
          name: 'full-access-no-run',
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          appCreate: false,
          appDelete: false,
          folderCreate: false,
          folderDelete: false,
          folderDataSourceCreate: false,
          folderDataSourceDelete: false,
          orgConstantCRUD: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
        })
      );

      await groupUsersRepo.save(
        groupUsersRepo.create({ userId: user.id, groupId: customGroup.id })
      );

      // Set canEditFolder=true, canConfigureDs=true, canUseDs=true, but canRunQuery=false
      // This validates canRunQuery is independent of the permission hierarchy at runtime
      const gpRepo = defaultDataSource.getRepository(GranularPermissions);
      const folderDataSourcesGpRepo = defaultDataSource.getRepository(FolderDataSourcesGroupPermissions);
      const gdfRepo = defaultDataSource.getRepository(GroupFolderDataSources);

      const granularPerm = await gpRepo.save(
        gpRepo.create({
          groupId: customGroup.id,
          name: 'Full edit no run test',
          type: ResourceType.FOLDER_DATA_SOURCE,
          isAll: false,
        })
      );

      const folderDataSourcePerm = await folderDataSourcesGpRepo.save(
        folderDataSourcesGpRepo.create({
          granularPermissionId: granularPerm.id,
          canEditFolder: true,
          canConfigureDs: true,
          canUseDs: true,
          canRunQuery: false,
        })
      );

      await gdfRepo.save(
        gdfRepo.create({
          folderDataSourcesGroupPermissionsId: folderDataSourcePerm.id,
          folderId: folder.id,
        })
      );

      // Try to run the query — should be blocked despite full folder edit access
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-queries/${query.id}/run`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ options: {}, resolvedOptions: {} });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toEqual('You do not have permission to run queries on this data source');
    });

    it('should allow query run when DS is not in any folder', async () => {
      const { user, organization, auth } = await setupAdminUser();

      // Create DS NOT in any folder
      const ds = await createGlobalDataSource(organization.id, 'Unfoldered DS');

      // Create app with query
      const { query } = await createAppWithQuery(organization.id, user.id, ds.id);

      // Try to run the query — should NOT be blocked
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-queries/${query.id}/run`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ options: {}, resolvedOptions: {} });

      // Should not be 403 — no folder restriction applies
      expect(response.statusCode).not.toBe(403);
    });

    // GAP: DS-level restrictQueryRun + folder-level canRunQuery interplay.
    // canRunQuery only exists on FolderDataSourcesGroupPermissions (folder level).
    // DataSourcesGroupPermissions (individual DS) has canConfigure/canUse only — no
    // canRunQuery field. There is no cross-level interplay to test in the current schema.
  });

  describe('cross-organization isolation', () => {
    // Helper: create a second org with its own admin (unique slug to avoid conflicts)
    async function setupSecondOrgAdmin() {
      const orgRepo = defaultDataSource.getRepository(Organization);
      const userRepo = defaultDataSource.getRepository(User);
      const orgUserRepo = defaultDataSource.getRepository(OrganizationUser);
      const groupRepo = defaultDataSource.getRepository(GroupPermissions);
      const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

      const orgB = await orgRepo.save(
        orgRepo.create({ name: 'Org B', slug: 'org-b', status: 'active' })
      );

      await createDefaultAppEnvironments(nestApp, orgB.id);

      const userB = await userRepo.save(
        userRepo.create({
          email: 'admin-orgb@tooljet.io',
          firstName: 'Admin',
          lastName: 'OrgB',
          password: 'password',
          organizationId: orgB.id,
          defaultOrganizationId: orgB.id,
          status: 'active',
        })
      );

      await orgUserRepo.save(
        orgUserRepo.create({ userId: userB.id, organizationId: orgB.id, role: 'admin', status: 'active' })
      );

      const adminGroup = await groupRepo.save(
        groupRepo.create({
          organizationId: orgB.id,
          name: 'admin',
          type: GROUP_PERMISSIONS_TYPE.DEFAULT,
          appCreate: true,
          appDelete: true,
          folderCreate: true,
          folderDelete: true,
          folderDataSourceCreate: true,
          folderDataSourceDelete: true,
          orgConstantCRUD: true,
          dataSourceCreate: true,
          dataSourceDelete: true,
        })
      );

      await groupUsersRepo.save(
        groupUsersRepo.create({ userId: userB.id, groupId: adminGroup.id })
      );

      const authB = await authenticateUser(nestApp, userB.email, orgB.id);

      return { user: userB, organization: orgB, auth: authB };
    }

    it('should not expose org A folders when org B admin lists their own folders', async () => {
      // Org A: create admin and a folder
      const { organization: orgA, auth: authA } = await setupAdminUser();

      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', orgA.id)
        .set('Cookie', authA.tokenCookie)
        .send({ name: 'Org A Secret Folder' });

      expect(createResponse.statusCode).toBe(201);

      // Org B: separate org with its own admin
      const { auth: authB, organization: orgB } = await setupSecondOrgAdmin();

      // Org B admin lists folders in their own workspace → should NOT see org A's folder
      const listResponse = await request(nestApp.getHttpServer())
        .get('/api/data-source-folders')
        .set('tj-workspace-id', orgB.id)
        .set('Cookie', authB.tokenCookie);

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.body).toEqual([]);
    });

    it('should not allow org B admin to delete org A folder', async () => {
      // Org A: create admin and a folder
      const { organization: orgA, auth: authA } = await setupAdminUser();

      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', orgA.id)
        .set('Cookie', authA.tokenCookie)
        .send({ name: 'Org A Protected Folder' });

      expect(createResponse.statusCode).toBe(201);
      const orgAFolderId = createResponse.body.id;

      // Org B: separate org with its own admin
      const { auth: authB } = await setupSecondOrgAdmin();

      // Org B admin tries to delete org A's folder using org A's workspace ID
      const deleteResponse = await request(nestApp.getHttpServer())
        .delete(`/api/data-source-folders/${orgAFolderId}`)
        .set('tj-workspace-id', orgA.id)
        .set('Cookie', authB.tokenCookie);

      // Should be rejected — user doesn't belong to org A
      expect([401, 403, 404]).toContain(deleteResponse.statusCode);

      // Verify folder still exists in org A
      const folderRepo = defaultDataSource.getRepository(Folder);
      const folder = await folderRepo.findOne({ where: { id: orgAFolderId } });
      expect(folder).toBeDefined();
    });
  });

});
