/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, authenticateUser } from '../test.helper';
import { getManager, Like } from 'typeorm';
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

describe('instance settings controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('GET /api/instance-settings', () => {
    it('should allow only authenticated users to list instance settings', async () => {
      await request(app.getHttpServer()).get('/api/instance-settings').expect(401);
    });

    it('should only able to list instance settings if the user is a super admin', async () => {
      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        userType: 'instance',
        groups: ['admin', 'all_users'],
      });

      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
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

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        superAdminUserData.organization.id
      );
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

  describe('POST /api/instance-settings', () => {
    it('should only be able to create a new settings if the user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        userType: 'instance',
        groups: ['admin', 'all_users'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.organization.id
      );
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

  describe('PATCH /api/instance-settings', () => {
    it('should only be able to update existing settings if the user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        userType: 'instance',
        groups: ['admin', 'all_users'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        superAdminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await createSettings(app, superAdminUserData, {
        key: 'SOME_SETTINGS_4',
        value: 'false',
      });

      await request(app.getHttpServer())
        .patch(`/api/instance-settings`)
        .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
        .send([{ value: 'true', id: response.body.setting.id }])
        .expect(200);

      const updatedSetting = await getManager().findOne(InstanceSettings, response.body.setting.id);

      expect(updatedSetting.value).toEqual('true');

      await request(app.getHttpServer())
        .patch(`/api/instance-settings`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send({ allow_personal_workspace: { value: 'true', id: response.body.setting.id } })
        .expect(403);
    });
  });

  describe('DELETE /api/instance-settings/:id', () => {
    it('should only be able to delete an existing setting if the user is a super admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        userType: 'instance',
        groups: ['admin', 'all_users'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        superAdminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await createSettings(app, superAdminUserData, {
        key: 'SOME_SETTINGS_5',
        value: 'false',
      });

      const preCount = await getManager().count(InstanceSettings);

      await request(app.getHttpServer())
        .delete(`/api/instance-settings/${response.body.setting.id}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send()
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/instance-settings/${response.body.setting.id}`)
        .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
        .send()
        .expect(200);

      const postCount = await getManager().count(InstanceSettings);
      expect(postCount).toEqual(preCount - 1);
    });
  });

  afterAll(async () => {
    await getManager().delete(InstanceSettings, { key: Like('%SOME_SETTINGS%') });
    await app.close();
  });
});
