import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createAdmin, createBuilder, ensureAppEnvironments } from 'test-helper';
import { RolesService } from '@modules/roles/service';
import { USER_ROLE } from '@modules/group-permissions/constants';

/**
 * Role downgrade | e2e tests.
 *
 * Demoting a builder who owns apps to end user with no ownership transfer target is
 * rejected with the names of the apps they own. The UI endpoint always transfers to the
 * acting admin; callers that omit `updatingUserId` (external API, SCIM) reach the rejection.
 * Names come from the app's version rows: apps created through the product leave apps.name null.
 */

const email = (label: string) => `${label}-${Date.now().toString(36)}@tooljet.io`;

/** @group platform */
describe('RolesService', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('updateUserRole | Demote to end user without a transfer target', () => {
    it('should reject with the owned app names when the builder owns apps', async () => {
      const admin = await createAdmin(nestApp, email('admin-demote'));
      const builder = await createBuilder(nestApp, email('builder-demote'), { workspace: admin.workspace });
      await ensureAppEnvironments(nestApp, admin.workspace.id);

      await request(nestApp.getHttpServer())
        .post('/api/apps')
        .set('Cookie', builder.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .send({ icon: 'home', name: 'Owned by builder', type: 'front-end' })
        .expect(201);

      const demote = nestApp
        .get(RolesService)
        .updateUserRole(admin.workspace.id, { userId: builder.user.id, newRole: USER_ROLE.END_USER });

      await expect(demote).rejects.toMatchObject({
        response: { message: { title: 'Can not change user role', data: ['Owned by builder'] } },
      });
    });
  });
});
