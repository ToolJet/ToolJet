import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { createFile, createUser, initTestApp, login, closeTestApp, getDefaultDataSource } from 'test-helper';

/**
 * @group platform
 */
describe('FilesController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('GET /api/files/:id | Get file', () => {
      it('should not allow un-authenticated users to fetch a file', async () => {
        await request(app.getHttpServer()).get('/api/files/2540333b-f6fe-42b7-857c-736f24f9b644').expect(401);
      });

      it('should not allow an authenticated user to fetch a file that is not a known avatar', async () => {
        const { user, organization } = await createUser(app, { email: 'orphan-file-viewer@tooljet.io' });
        const file = await createFile(app);
        const loggedUser = await login(app, user.email);

        await request(app.getHttpServer())
          .get(`/api/files/${file.id}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', loggedUser.tokenCookie)
          .expect(403);
      });

      it('should allow a user to fetch their own avatar', async () => {
        const { user, organization } = await createUser(app, {
          email: 'self-avatar@tooljet.io',
          groups: ['end-user'],
        });
        const file = await createFile(app);
        await getDefaultDataSource().getRepository(User).update(user.id, { avatarId: file.id });
        const loggedUser = await login(app, user.email);

        await request(app.getHttpServer())
          .get(`/api/files/${file.id}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', loggedUser.tokenCookie)
          .expect(200);
      });

      it("should not allow a viewer to fetch another user's avatar in the same organization", async () => {
        const { user: owner, organization } = await createUser(app, {
          email: 'avatar-owner@tooljet.io',
          groups: ['end-user'],
        });
        const file = await createFile(app);
        await getDefaultDataSource().getRepository(User).update(owner.id, { avatarId: file.id });

        const { user: viewer } = await createUser(app, {
          email: 'other-viewer@tooljet.io',
          groups: ['end-user'],
          organization,
        });
        const loggedViewer = await login(app, viewer.email);

        await request(app.getHttpServer())
          .get(`/api/files/${file.id}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', loggedViewer.tokenCookie)
          .expect(403);
      });

      it("should allow an admin to fetch another user's avatar in the same organization", async () => {
        const { user: owner, organization } = await createUser(app, {
          email: 'avatar-owner-2@tooljet.io',
          groups: ['end-user'],
        });
        const file = await createFile(app);
        await getDefaultDataSource().getRepository(User).update(owner.id, { avatarId: file.id });

        const { user: admin } = await createUser(app, {
          email: 'org-admin@tooljet.io',
          groups: ['admin'],
          organization,
        });
        const loggedAdmin = await login(app, admin.email);

        await request(app.getHttpServer())
          .get(`/api/files/${file.id}`)
          .set('tj-workspace-id', organization.id)
          .set('Cookie', loggedAdmin.tokenCookie)
          .expect(200);
      });

      it("should not allow an admin from a different organization to fetch another organization's avatar", async () => {
        const { user: owner } = await createUser(app, {
          email: 'avatar-owner-3@tooljet.io',
          groups: ['end-user'],
        });
        const file = await createFile(app);
        await getDefaultDataSource().getRepository(User).update(owner.id, { avatarId: file.id });

        const { user: otherAdmin, organization: otherOrganization } = await createUser(app, {
          email: 'other-org-admin@tooljet.io',
          groups: ['admin'],
        });
        const loggedAdmin = await login(app, otherAdmin.email);

        await request(app.getHttpServer())
          .get(`/api/files/${file.id}`)
          .set('tj-workspace-id', otherOrganization.id)
          .set('Cookie', loggedAdmin.tokenCookie)
          .expect(403);
      });

      it("should not allow an end-user from a different organization to fetch another organization's avatar", async () => {
        const { user: victim } = await createUser(app, {
          email: 'workspace-b-victim@tooljet.io',
          groups: ['end-user'],
        });
        const file = await createFile(app);
        await getDefaultDataSource().getRepository(User).update(victim.id, { avatarId: file.id });

        const { user: attacker, organization: attackerOrganization } = await createUser(app, {
          email: 'workspace-a-attacker@tooljet.io',
          groups: ['end-user'],
        });
        const loggedAttacker = await login(app, attacker.email);

        await request(app.getHttpServer())
          .get(`/api/files/${file.id}`)
          .set('tj-workspace-id', attackerOrganization.id)
          .set('Cookie', loggedAttacker.tokenCookie)
          .expect(403);
      });
    });
  });
});
