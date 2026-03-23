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
import {
  createNestAppInstance,
  createUser,
  authenticateUser,
  clearDB,
  setupOrganizationAndUser,
} from '../workflows.helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';

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
  async function createDsFolder(orgId: string, name: string, creatorId?: string) {
    const repo = defaultDataSource.getRepository(Folder);
    return repo.save(
      repo.create({
        name,
        organizationId: orgId,
        type: 'data_source',
        ...(creatorId ? { creatorId } : {}),
      })
    );
  }

  // Helper: setup a user with admin permissions (including dataSourceFolderCRUD)
  async function setupAdminUser() {
    const { user, organization } = await setupOrganizationAndUser(nestApp, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User',
    });

    // Create admin group with dataSourceFolderCRUD permission
    const groupRepo = defaultDataSource.getRepository(GroupPermissions);
    const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

    const adminGroup = groupRepo.create({
      organizationId: organization.id,
      name: 'admin',
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
      appCreate: true,
      appDelete: true,
      folderCRUD: true,
      dataSourceFolderCRUD: true,
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

  // Helper: setup a non-admin user (no dataSourceFolderCRUD)
  async function setupViewerUser(organizationId: string) {
    const viewer = await createUser(nestApp, {
      email: 'viewer@tooljet.io',
      password: 'password',
      firstName: 'Viewer',
      lastName: 'User',
      organizationId,
    });

    // Create end-user group without dataSourceFolderCRUD
    const groupRepo = defaultDataSource.getRepository(GroupPermissions);
    const groupUsersRepo = defaultDataSource.getRepository(GroupUsers);

    const viewerGroup = groupRepo.create({
      organizationId,
      name: 'end-user',
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
      appCreate: false,
      appDelete: false,
      folderCRUD: false,
      dataSourceFolderCRUD: false,
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
      expect(folder.creatorId).toEqual(user.id);
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

    it('should deny users without dataSourceFolderCRUD permission', async () => {
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

});
