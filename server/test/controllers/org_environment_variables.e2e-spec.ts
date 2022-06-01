/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';

const createVariable = async (app: INestApplication, adminUserData: any, body: any) => {
  return await request(app.getHttpServer())
    .post(`/api/organization-variables/`)
    .set('Authorization', authHeaderForUser(adminUserData.user))
    .send(body);
};

describe('organization environment variables controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('GET /api/organization-variables', () => {
    it('should allow only authenticated users to list org users', async () => {
      await request(app.getHttpServer()).get('/api/organization-variables/').expect(401);
    });

    it('should list decrypted organization environment variables', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      const organization = adminUserData.organization;

      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['developer', 'all_users'],
        organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization,
      });

      const bodyArray = [
        {
          variable_name: 'email',
          variable_type: 'server',
          value: 'test@tooljet.io',
          encrypted: true,
        },
        {
          variable_name: 'name',
          variable_type: 'client',
          value: 'demo_user',
          encrypted: false,
        },
      ];

      const variableArray = [];
      for (const body in bodyArray) {
        const result = await createVariable(app, adminUserData, body);
        variableArray.push(result.body.variable);
      }

      await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('Authorization', authHeaderForUser(developerUserData.user))
        .send()
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('Authorization', authHeaderForUser(viewerUserData.user))
        .send()
        .expect(200);

      const listResponse = await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send()
        .expect(200);

      listResponse.body.variables.map((variable: any, index: any) => {
        expect(variable).toStrictEqual({
          variableName: variableArray[index].variableName,
          value: bodyArray[0].value,
          variableType: bodyArray[0].variable_type,
          id: variableArray[index].id,
          encrypted: variableArray[index].encrypted,
        });
      });
    });
  });

  describe('POST /api/organization-variables/', () => {
    it('should allow only admin to be able to create new variable', async () => {
      // setup a pre existing user of different organization
      await createUser(app, {
        email: 'someUser@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      // setup organization and user setup to test against
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      const organization = adminUserData.organization;

      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['developer', 'all_users'],
        organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization,
      });

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ variable_name: 'email', variable_type: 'server', value: 'test@tooljet.io', encrypted: true })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('Authorization', authHeaderForUser(developerUserData.user))
        .send({ variable_name: 'email', variable_type: 'server', value: 'test@tooljet.io', encrypted: true })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('Authorization', authHeaderForUser(viewerUserData.user))
        .send({ variable_name: 'email', variable_type: 'server', value: 'test@tooljet.io', encrypted: true })
        .expect(403);
    });
  });

  describe('PATCH /api/organization-variables/:id', () => {
    it('should allow only admin to be able to update a variable', async () => {
      // setup organization and user setup to test against
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      const organization = adminUserData.organization;

      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['developer', 'all_users'],
        organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization,
      });

      const response = await createVariable(app, adminUserData, {
        variable_name: 'email',
        variable_type: 'server',
        value: 'test@tooljet.io',
        encrypted: true,
      });

      await request(app.getHttpServer())
        .patch(`/api/organization-variables/${response.body.variable.id}`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ variable_name: 'email', value: 'test1@tooljet.io' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/organization-variables/${response.body.variable.id}`)
        .set('Authorization', authHeaderForUser(developerUserData.user))
        .send({ variable_name: 'email', value: 'test2@tooljet.io' })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/api/organization-variables/${response.body.variable.id}`)
        .set('Authorization', authHeaderForUser(viewerUserData.user))
        .send({ variable_name: 'email', value: 'test3@tooljet.io' })
        .expect(403);
    });
  });

  describe('DELETE /api/organization-variables/:id', () => {
    it('should allow only admin to be able to delete a variable', async () => {
      // setup organization and user setup to test against
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      const organization = adminUserData.organization;

      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['developer', 'all_users'],
        organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization,
      });

      const response1 = await createVariable(app, adminUserData, {
        variable_name: 'email',
        value: 'test@tooljet.io',
        variable_type: 'server',
        encrypted: true,
      });

      await request(app.getHttpServer())
        .delete(`/api/organization-variables/${response1.body.variable.id}`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send()
        .expect(200);

      const response2 = await createVariable(app, adminUserData, {
        variable_name: 'email',
        value: 'test1@tooljet.io',
        variable_type: 'client',
        encrypted: true,
      });

      await request(app.getHttpServer())
        .delete(`/api/organization-variables/${response2.body.variable.id}`)
        .set('Authorization', authHeaderForUser(developerUserData.user))
        .send()
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/organization-variables/${response2.body.variable.id}`)
        .set('Authorization', authHeaderForUser(viewerUserData.user))
        .send()
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
