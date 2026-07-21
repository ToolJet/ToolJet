/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  closeTestApp,
  login,
  findEntity,
  countEntities,
  updateEntity,
  deleteEntities,
} from 'test-helper';
import { Like } from 'typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';

const createSettings = async (app: INestApplication, userData: any, body: any) => {
  const response = await request(app.getHttpServer())
    .post(`/api/instance-settings`)
    .set('tj-workspace-id', userData.user.defaultOrganizationId)
    .set('Cookie', userData['tokenCookie'])
    .send(body);

  expect(response.statusCode).toEqual(201);
  return response;
};

/** @group platform */
describe('InstanceSettingsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await deleteEntities(InstanceSettings, { key: Like('%SOME_SETTINGS%') } as any);
    await closeTestApp(app);
  }, 60_000);

  describe('EE (plan: enterprise)', () => {
    describe('GET /api/instance-settings | List settings', () => {
      it('should allow only authenticated users to list instance settings', async () => {
        await request(app.getHttpServer()).get('/api/instance-settings').expect(401);
      });

      it('should only able to list instance settings if the user is a super admin', async () => {
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
          groups: ['admin', 'end-user'],
        });

        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
        });

        const bodyArray = [
          {
            key: 'SOME_SETTINGS_1',
            value: 'true',
          },
          {
            key: 'SOME_SETTINGS_2',
            value: 'false',
          },
        ];

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, superAdminUserData.user.email, 'password', superAdminUserData.organization.id);
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const settingsArray = [];

        await Promise.all(
          bodyArray.map(async (body) => {
            const result = await createSettings(app, superAdminUserData, body);
            settingsArray.push(result.body.setting);
          })
        );

        console.log('inside', bodyArray, settingsArray);

        let listResponse = await request(app.getHttpServer())
          .get(`/api/instance-settings`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send()
          .expect(403);

        listResponse = await request(app.getHttpServer())
          .get(`/api/instance-settings`)
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send()
          .expect(200);

        expect(listResponse.body.settings.length).toBeGreaterThanOrEqual(bodyArray.length);
      });
    });

    describe('POST /api/instance-settings | Create setting', () => {
      it('should only be able to create a new settings if the user is a super admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['end-user', 'admin'],
        });

        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
          groups: ['admin', 'end-user'],
        });

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, superAdminUserData.user.email, 'password', adminUserData.organization.id);
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        await request(app.getHttpServer())
          .post(`/api/instance-settings`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({
            key: 'SOME_SETTINGS_3',
            value: 'false',
          })
          .expect(201);

        await request(app.getHttpServer())
          .post(`/api/instance-settings`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({
            key: 'SOME_SETTINGS_3',
            value: 'false',
          })
          .expect(403);
      });
    });

    describe('PATCH /api/instance-settings | Update setting', () => {
      it('should only be able to update existing settings if the user is a super admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['end-user', 'admin'],
        });

        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
          groups: ['admin', 'end-user'],
        });

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, superAdminUserData.user.email, 'password', superAdminUserData.organization.id);
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        // Find or create the ENABLE_COMMENTS setting (may already exist from app startup)
        let createdSetting = await findEntity(InstanceSettings, { key: 'ENABLE_COMMENTS' } as any);
        if (!createdSetting) {
          await createSettings(app, superAdminUserData, { key: 'ENABLE_COMMENTS', value: 'false' });
          createdSetting = await findEntity(InstanceSettings, { key: 'ENABLE_COMMENTS' } as any);
        } else {
          // Reset to known state
          await updateEntity(InstanceSettings, createdSetting.id, { value: 'false' });
        }

        await request(app.getHttpServer())
          .patch(`/api/instance-settings`)
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({ settings: [{ value: 'true', id: createdSetting.id, key: 'ENABLE_COMMENTS' }] })
          .expect(200);

        const updatedSetting = await findEntity(InstanceSettings, { id: createdSetting.id } as any);

        expect(updatedSetting.value).toEqual('true');

        await request(app.getHttpServer())
          .patch(`/api/instance-settings`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({ allow_personal_workspace: { value: 'true', id: createdSetting.id } })
          .expect(403);
      });
    });

    describe('DELETE /api/instance-settings/:id | Delete setting', () => {
      it('should only be able to delete an existing setting if the user is a super admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['end-user', 'admin'],
        });

        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
          groups: ['admin', 'end-user'],
        });

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, superAdminUserData.user.email, 'password', superAdminUserData.organization.id);
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        await createSettings(app, superAdminUserData, {
          key: 'SOME_SETTINGS_5',
          value: 'false',
        });

        // EE create returns empty body | query DB for the created setting
        const createdSetting = await findEntity(InstanceSettings, { key: 'SOME_SETTINGS_5' } as any);

        const preCount = await countEntities(InstanceSettings);

        await request(app.getHttpServer())
          .delete(`/api/instance-settings/${createdSetting.id}`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send()
          .expect(403);

        await request(app.getHttpServer())
          .delete(`/api/instance-settings/${createdSetting.id}`)
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send()
          .expect(200);

        const postCount = await countEntities(InstanceSettings);
        expect(postCount).toEqual(preCount - 1);
      });
    });
  });
});
