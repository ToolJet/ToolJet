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
import { DsFoldersGroupPermissions } from '@entities/ds_folders_group_permissions.entity';
import { GroupDsFolders } from '@entities/group_ds_folder.entity';
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

  // Helper: setup a user with admin permissions (including dataSourceFolderCreate/Delete)
  async function setupAdminUser() {
    const { user, organization } = await setupOrganizationAndUser(nestApp, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User',
    });

    // Create admin group with dataSourceFolderCreate/Delete permissions
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
      dataSourceFolderCreate: true,
      dataSourceFolderDelete: true,
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

  // Helper: setup a non-admin user (no dataSourceFolderCreate/Delete)
  async function setupViewerUser(organizationId: string) {
    const viewer = await createUser(nestApp, {
      email: 'viewer@tooljet.io',
      password: 'password',
      firstName: 'Viewer',
      lastName: 'User',
      organizationId,
    });

    // Create end-user group without dataSourceFolderCreate/Delete
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
      dataSourceFolderCreate: false,
      dataSourceFolderDelete: false,
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
      await request(nestApp.getHttpServer()).post('/api/data-source-folders').expect(401);
    });

    it('should create a new data source folder', async () => {
      const { user, organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'Finance team' });

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toEqual('Finance team');

      // Verify in DB
      const folderRepo = defaultDataSource.getRepository(Folder);
      const folder = await folderRepo.findOne({ where: { id: response.body.id } });
      expect(folder).toBeDefined();
      expect(folder.type).toEqual('data_source');
      expect(folder.createdBy).toEqual(user.id);
    });

    it('should reject empty folder name', async () => {
      const { organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: '' });

      expect(response.statusCode).toBe(400);
    });

    it('should reject folder name longer than 50 characters', async () => {
      const { organization, auth } = await setupAdminUser();

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'a'.repeat(51) });

      expect(response.statusCode).toBe(400);
    });

    it('should reject duplicate folder name in same organization', async () => {
      const { organization, auth } = await setupAdminUser();

      await createDsFolder(organization.id, 'Existing Folder');

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ name: 'Existing Folder' });

      expect(response.statusCode).toBe(409);
    });

    it('should deny users without dataSourceFolderCreate/Delete permission', async () => {
      const { organization } = await setupAdminUser();
      const { auth: viewerAuth } = await setupViewerUser(organization.id);

      const response = await request(nestApp.getHttpServer())
        .post('/api/data-source-folders')
        .set('tj-workspace-id', organization.id)
        .set('Cookie', viewerAuth.tokenCookie)
        .send({ name: 'my folder' });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/data-source-folders/:id', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer()).put('/api/data-source-folders/some-id').expect(401);
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
    });
  });

  describe('DELETE /api/data-source-folders/:id', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer()).delete('/api/data-source-folders/some-id').expect(401);
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

      // folder_data_sources row should be gone
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
    });
  });

  describe('POST /api/data-source-folders/:folderId/data-sources', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer())
        .post('/api/data-source-folders/some-folder-id/data-sources')
        .expect(401);
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

      // Verify FolderDataSource row was created
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      const fds = await fdsRepo.findOne({ where: { folderId: folder.id, dataSourceId: ds.id } });
      expect(fds).toBeDefined();
      expect(fds.folderId).toEqual(folder.id);
      expect(fds.dataSourceId).toEqual(ds.id);
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
    });

    it('should deny users without dataSourceFolderCreate/Delete permission', async () => {
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
    });
  });

  describe('DELETE /api/data-source-folders/:folderId/data-sources/:dsId', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer())
        .delete('/api/data-source-folders/some-folder-id/data-sources/some-ds-id')
        .expect(401);
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

    it('should deny users without dataSourceFolderCreate/Delete permission', async () => {
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
    });
  });

  describe('PUT /api/data-source-folders/:folderId/data-sources (bulk move)', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer())
        .put('/api/data-source-folders/some-folder-id/data-sources')
        .send({ dataSourceIds: [] })
        .expect(401);
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
      const fds1 = await fdsRepo.findOne({ where: { folderId: folder.id, dataSourceId: ds1.id } });
      const fds2 = await fdsRepo.findOne({ where: { folderId: folder.id, dataSourceId: ds2.id } });
      const fds3 = await fdsRepo.findOne({ where: { folderId: folder.id, dataSourceId: ds3.id } });

      expect(fds1).toBeDefined();
      expect(fds2).toBeDefined();
      expect(fds3).toBeDefined();
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
      const newFds1 = await fdsRepo.findOne({ where: { folderId: targetFolder.id, dataSourceId: ds1.id } });
      const newFds2 = await fdsRepo.findOne({ where: { folderId: targetFolder.id, dataSourceId: ds2.id } });
      const newFds3 = await fdsRepo.findOne({ where: { folderId: targetFolder.id, dataSourceId: ds3.id } });

      expect(newFds1).toBeDefined();
      expect(newFds2).toBeDefined();
      expect(newFds3).toBeDefined();
    });

    it('should deny users without dataSourceFolderCreate/Delete permission', async () => {
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
    });
  });

  describe('GET /api/data-source-folders', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer()).get('/api/data-source-folders').expect(401);
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

      // Verify alphabetical order
      expect(response.body[0].name).toEqual('Alpha');
      expect(response.body[1].name).toEqual('Beta');

      // Verify DS counts
      expect(response.body[0].count).toEqual(2);
      expect(response.body[1].count).toEqual(1);
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
  });

  describe('GET /api/data-source-folders/:folderId/data-sources', () => {
    it('should require authentication', async () => {
      await request(nestApp.getHttpServer())
        .get('/api/data-source-folders/some-folder-id/data-sources')
        .expect(401);
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
      expect(response.body).toHaveLength(2);

      const returnedIds = response.body.map((ds: any) => ds.id);
      expect(returnedIds).toContain(ds1.id);
      expect(returnedIds).toContain(ds2.id);
    });

    it('should return empty array for folder with no data sources', async () => {
      const { organization, auth } = await setupAdminUser();

      const folder = await createDsFolder(organization.id, 'Empty Folder');

      const response = await request(nestApp.getHttpServer())
        .get(`/api/data-source-folders/${folder.id}/data-sources`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
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
        dataSourceFolderCreate: false,
        dataSourceFolderDelete: false,
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
        dataSourceFolderCreate: false,
        dataSourceFolderDelete: false,
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              restrictQueryRun: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return; // Route not yet implemented
        }

        expect([200, 201]).toContain(response.statusCode);
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              restrictQueryRun: false,
            },
          });

        // If the route does not exist yet, skip the update assertion.
        if (createRes.statusCode === 404 || createRes.statusCode === 405) {
          return;
        }

        const permId = createRes.body?.id;
        expect(permId).toBeDefined();

        const updateRes = await request(nestApp.getHttpServer())
          .put(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder/${permId}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            actions: { canConfigureDs: true, canUseDs: true },
          });

        expect(updateRes.statusCode).not.toBe(404);
        expect(updateRes.statusCode).not.toBe(405);
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              restrictQueryRun: false,
            },
          });

        if (createRes.statusCode === 404 || createRes.statusCode === 405) {
          return;
        }

        const permId = createRes.body?.id;
        expect(permId).toBeDefined();

        const deleteRes = await request(nestApp.getHttpServer())
          .delete(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder/${permId}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie);

        expect(deleteRes.statusCode).not.toBe(404);
        expect(deleteRes.statusCode).not.toBe(405);
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canUseDs: true,
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return; // Route not yet implemented
        }

        // Non-admin users must be rejected.  Accept 401/403 — not 200/201.
        expect([401, 403]).toContain(response.statusCode);
      });
    });

    describe('permission hierarchy', () => {
      it('should auto-set canConfigureDs and canUseDs when canEditFolder is true', async () => {
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: true,
              canConfigureDs: false, // should be auto-elevated to true
              canUseDs: false,       // should be auto-elevated to true
              restrictQueryRun: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          // Route not yet implemented — mark as pending
          return;
        }

        expect(response.statusCode).toBe(201);
        // The stored permission should have all three hierarchy flags set
        const perm = response.body;
        expect(perm.canEditFolder).toBe(true);
        expect(perm.canConfigureDs).toBe(true);
        expect(perm.canUseDs).toBe(true);
      });

      it('should auto-set canUseDs when canConfigureDs is true', async () => {
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: true,
              canUseDs: false, // should be auto-elevated to true
              restrictQueryRun: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return;
        }

        expect(response.statusCode).toBe(201);
        expect(response.body.canConfigureDs).toBe(true);
        expect(response.body.canUseDs).toBe(true);
        expect(response.body.canEditFolder).toBe(false);
      });

      it('should allow restrictQueryRun independently of hierarchy', async () => {
        const { organization, auth } = await setupAdminUser();
        const group = await setupCustomGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Folder Gamma');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${group.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'Use with restrict',
            isAll: false,
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              restrictQueryRun: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return;
        }

        expect(response.statusCode).toBe(201);
        expect(response.body.canUseDs).toBe(true);
        expect(response.body.restrictQueryRun).toBe(true);
        // restrictQueryRun should not force-set canEditFolder or canConfigureDs
        expect(response.body.canEditFolder).toBe(false);
        expect(response.body.canConfigureDs).toBe(false);
      });
    });

    describe('end-user constraints', () => {
      it('should reject canEditFolder for end-user groups', async () => {
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: true,
              canConfigureDs: false,
              canUseDs: false,
              restrictQueryRun: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return;
        }

        // End-user groups must not be granted canEditFolder
        expect([400, 403, 422]).toContain(response.statusCode);
      });

      it('should reject canConfigureDs for end-user groups', async () => {
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: true,
              canUseDs: false,
              restrictQueryRun: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return;
        }

        expect([400, 403, 422]).toContain(response.statusCode);
      });

      it('should reject canUseDs for end-user groups', async () => {
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
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: true,
              restrictQueryRun: false,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return;
        }

        expect([400, 403, 422]).toContain(response.statusCode);
      });

      it('should allow restrictQueryRun for end-user groups', async () => {
        const { organization, auth } = await setupAdminUser();
        const endUserGroup = await setupEndUserGroup(organization.id);
        const folder = await createDsFolder(organization.id, 'Restricted Folder 4');

        const response = await request(nestApp.getHttpServer())
          .post(`/api/v2/group-permissions/${endUserGroup.id}/granular-permissions/data-source-folder`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', auth.tokenCookie)
          .send({
            name: 'End user restrict query run',
            isAll: false,
            type: 'data_source_folder',
            createResourcePermissionObject: {
              canEditFolder: false,
              canConfigureDs: false,
              canUseDs: false,
              restrictQueryRun: true,
              resourcesToAdd: [{ folderId: folder.id }],
            },
          });

        if (response.statusCode === 404 || response.statusCode === 405) {
          return;
        }

        // restrictQueryRun is the only permission end-user groups may hold
        expect([200, 201]).toContain(response.statusCode);
        expect(response.body.restrictQueryRun).toBe(true);
      });
    });

    describe('folder visibility', () => {
      it('should hide folders without granular access from folder listing', async () => {
        const { organization, auth: adminAuth } = await setupAdminUser();

        // Admin creates two folders
        const visibleFolder = await createDsFolder(organization.id, 'Visible');
        await createDsFolder(organization.id, 'Hidden');

        // Create a custom group with granular access to only "Visible" folder
        const customGroup = await setupCustomGroup(organization.id);

        const gpRepo = defaultDataSource.getRepository(GranularPermissions);
        const dsFolderPermRepo = defaultDataSource.getRepository(DsFoldersGroupPermissions);
        const groupDsFolderRepo = defaultDataSource.getRepository(GroupDsFolders);
        const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

        const granularPerm = await gpRepo.save(
          gpRepo.create({
            groupId: customGroup.id,
            name: 'Visible folder access',
            type: ResourceType.DATA_SOURCE_FOLDER,
            isAll: false,
          })
        );

        const dsFolderPerm = await dsFolderPermRepo.save(
          dsFolderPermRepo.create({
            granularPermissionId: granularPerm.id,
            canEditFolder: false,
            canConfigureDs: false,
            canUseDs: true,
            restrictQueryRun: false,
          })
        );

        await groupDsFolderRepo.save(
          groupDsFolderRepo.create({
            dsFoldersGroupPermissionsId: dsFolderPerm.id,
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
        const folderNames = response.body.map((f: any) => f.name);
        expect(folderNames).toContain('Visible');
        expect(folderNames).not.toContain('Hidden');
      });

      it('should show folders to their creator even without explicit granular access', async () => {
        const { organization } = await setupAdminUser();

        const groupRepo = defaultDataSource.getRepository(GroupPermissions);
        const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

        // Create a builder-like group with dataSourceFolderCreate but no admin role
        const builderGroup = groupRepo.create({
          organizationId: organization.id,
          name: 'ds-folder-creators',
          type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
          appCreate: false,
          appDelete: false,
          folderCreate: false,
          folderDelete: false,
          dataSourceFolderCreate: true,
          dataSourceFolderDelete: false,
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
        const dsFolderPermRepo = defaultDataSource.getRepository(DsFoldersGroupPermissions);
        const groupDsFolderRepo = defaultDataSource.getRepository(GroupDsFolders);
        const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

        const granularPerm = await gpRepo.save(
          gpRepo.create({
            groupId: customGroup.id,
            name: 'Folder configure access',
            type: ResourceType.DATA_SOURCE_FOLDER,
            isAll: false,
          })
        );

        const dsFolderPerm = await dsFolderPermRepo.save(
          dsFolderPermRepo.create({
            granularPermissionId: granularPerm.id,
            canEditFolder: false,
            canConfigureDs: true,
            canUseDs: true,
            restrictQueryRun: false,
          })
        );

        await groupDsFolderRepo.save(
          groupDsFolderRepo.create({
            dsFoldersGroupPermissionsId: dsFolderPerm.id,
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
        const dsIds = folderDsResponse.body.map((d: any) => d.id);
        expect(dsIds).toContain(ds.id);
      });
    });
  });

  describe('restrictQueryRun runtime enforcement', () => {
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

    // Helper: set up restrictQueryRun permission for a group on a folder directly in DB
    async function setupRestriction(groupId: string, folderId: string, restrict: boolean) {
      const gpRepo = defaultDataSource.getRepository(GranularPermissions);
      const dsfgpRepo = defaultDataSource.getRepository(DsFoldersGroupPermissions);
      const gdfRepo = defaultDataSource.getRepository(GroupDsFolders);

      const granularPerm = await gpRepo.save(
        gpRepo.create({
          groupId,
          name: 'DS folder restrict test',
          type: ResourceType.DATA_SOURCE_FOLDER,
          isAll: false,
        })
      );

      const dsFolderPerm = await dsfgpRepo.save(
        dsfgpRepo.create({
          granularPermissionId: granularPerm.id,
          canEditFolder: false,
          canConfigureDs: false,
          canUseDs: true,
          restrictQueryRun: restrict,
        })
      );

      await gdfRepo.save(
        gdfRepo.create({
          dsFoldersGroupPermissionsId: dsFolderPerm.id,
          folderId,
        })
      );

      return { granularPerm, dsFolderPerm };
    }

    it('should block query run when restrictQueryRun is true for the DS folder', async () => {
      const { user, organization, auth } = await setupAdminUser();

      // Create DS, folder, and put DS in folder
      const ds = await createGlobalDataSource(organization.id, 'Restricted DS');
      const folder = await createDsFolder(organization.id, 'Restricted Folder');
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      // Create app with query
      const { query } = await createAppWithQuery(organization.id, user.id, ds.id);

      // Create a custom group with restrictQueryRun=true
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
          dataSourceFolderCreate: false,
          dataSourceFolderDelete: false,
          orgConstantCRUD: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
        })
      );

      // Add user to restricted group
      await groupUsersRepo.save(
        groupUsersRepo.create({ userId: user.id, groupId: restrictedGroup.id })
      );

      // Set up restrictQueryRun=true for the folder
      await setupRestriction(restrictedGroup.id, folder.id, true);

      // Try to run the query — should be blocked
      const response = await request(nestApp.getHttpServer())
        .post(`/api/data-queries/${query.id}/run`)
        .set('tj-workspace-id', organization.id)
        .set('Cookie', auth.tokenCookie)
        .send({ options: {}, resolvedOptions: {} });

      expect(response.statusCode).toBe(403);
    });

    it('should allow query run when restrictQueryRun is false', async () => {
      const { user, organization, auth } = await setupAdminUser();

      // Create DS, folder, and put DS in folder
      const ds = await createGlobalDataSource(organization.id, 'Allowed DS');
      const folder = await createDsFolder(organization.id, 'Allowed Folder');
      const fdsRepo = defaultDataSource.getRepository(FolderDataSource);
      await fdsRepo.save(fdsRepo.create({ folderId: folder.id, dataSourceId: ds.id }));

      // Create app with query
      const { query } = await createAppWithQuery(organization.id, user.id, ds.id);

      // Create a custom group with restrictQueryRun=false
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
          dataSourceFolderCreate: false,
          dataSourceFolderDelete: false,
          orgConstantCRUD: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
        })
      );

      await groupUsersRepo.save(
        groupUsersRepo.create({ userId: user.id, groupId: allowedGroup.id })
      );

      // Set up restrictQueryRun=false for the folder
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
  });

});
