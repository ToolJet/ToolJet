/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';
import { getManager } from 'typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';

const createSettings = async (app: INestApplication, adminUserData: any, body: any) => {
  return await request(app.getHttpServer())
    .post(`/api/instance_settings`)
    .set('Authorization', authHeaderForUser(adminUserData.user))
    .send(body);
};

describe('instance settings controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('GET /api/instance_settings', () => {
    it('should allow only authenticated users to list instance settings', async () => {
      await request(app.getHttpServer()).get('/api/instance_settings').expect(401);
    });

    it('should list instance settings', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      const bodyArray = [
        {
          key: 'ALLOW_PERSONAL_WORKSPACE',
          value: 'false',
        },
        {
          key: 'ALLOW_PLUGIN_INTEGRATION',
          value: 'false',
        },
      ];

      const settingsArray = [];

      await Promise.all(
        bodyArray.map(async (body) => {
          const result = await createSettings(app, adminUserData, body);
          settingsArray.push(result.body.setting);
        })
      );

      const listResponse = await request(app.getHttpServer())
        .get(`/api/instance_settings`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send()
        .expect(200);

      listResponse.body.settings.map((setting: any, index: any) => {
        expect(setting).toStrictEqual({
          ...setting,
          key: bodyArray[index].key,
          value: bodyArray[index].value,
        });
      });
    });
  });

  describe('POST /api/instance_settings', () => {
    it('should be able to create a new settings', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      await request(app.getHttpServer())
        .post(`/api/instance_settings`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({
          key: 'ALLOW_PLUGIN_INTEGRATION',
          value: 'false',
        })
        .expect(201);
    });
  });

  describe('PATCH /api/instance_settings/:id', () => {
    it('should be able to update an existing setting', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const response = await createSettings(app, adminUserData, {
        key: 'ALLOW_PLUGIN_INTEGRATION',
        value: 'false',
      });

      await request(app.getHttpServer())
        .patch(`/api/instance_settings/${response.body.setting.id}`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ value: 'true' })
        .expect(200);

      const updatedSetting = await getManager().findOne(InstanceSettings, response.body.setting.id);

      expect(updatedSetting.value).toEqual('true');
    });
  });

  describe('DELETE /api/instance_settings/:id', () => {
    it('should be able to delete an existing setting', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });

      const response = await createSettings(app, adminUserData, {
        key: 'ALLOW_PLUGIN_INTEGRATION',
        value: 'false',
      });

      const preCount = await getManager().count(InstanceSettings);

      await request(app.getHttpServer())
        .delete(`/api/instance_settings/${response.body.setting.id}`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send()
        .expect(200);

      const postCount = await getManager().count(InstanceSettings);
      expect(postCount).toEqual(preCount - 1);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
