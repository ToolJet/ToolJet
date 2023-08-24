/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createUser,
  createNestAppInstance,
  createGroupPermission,
  authenticateUser,
  createAppEnvironments,
} from '../test.helper';
import { getManager } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';

const createConstant = async (app: INestApplication, adminUserData: any, body: any) => {
  return await request(app.getHttpServer())
    .post(`/api/organization-constants/`)
    .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
    .set('Cookie', adminUserData['tokenCookie'])
    .send(body);
};

describe('organization environment constants controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('GET /api/organization-constants', () => {
    it('should allow only authenticated users to list org users', async () => {
      await request(app.getHttpServer()).get('/api/organization-constants/').expect(401);
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

      const appEnvironments = await createAppEnvironments(app, adminUserData.user.organizationId);

      const bodyArray = [
        {
          constant_name: 'user_name',
          value: 'The Dev',
          environments: appEnvironments.map((env) => env.id),
        },
      ];

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const constantArray = [];
      for (const body of bodyArray) {
        const result = await createConstant(app, adminUserData, body);
        constantArray.push(result.body.constant);
      }

      await request(app.getHttpServer())
        .get(`/api/organization-constants/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send()
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/organization-constants/`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send()
        .expect(200);

      const listResponse = await request(app.getHttpServer())
        .get(`/api/organization-constants/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send()
        .expect(200);

      listResponse.body.constants.map((constant: any, index: any) => {
        const orgConstant = JSON.parse(JSON.stringify(constant));

        delete orgConstant.createdAt;
        delete orgConstant.id;

        const expectedConstant = {
          name: bodyArray[index].constant_name,
          values: bodyArray[index].environments.map((envId: any) => {
            const appEnvironment = appEnvironments.find((env) => env.id === envId);
            return {
              environmentName: appEnvironment.name,
              value: bodyArray[index].value,
              id: appEnvironment.id,
            };
          }),
        };

        expect(orgConstant).toEqual(expectedConstant);
      });
    });
  });

  describe('POST /api/organization-constants/', () => {
    it('should be able to create a new constant if group is admin or has create permission in the same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization: adminUserData.organization,
      });

      const developerGroup = await getManager().findOneOrFail(GroupPermission, {
        where: { group: 'developer' },
      });

      await getManager().update(GroupPermission, developerGroup.id, {
        orgEnvironmentConstantCreate: true,
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const appEnvironments = await createAppEnvironments(app, adminUserData.user.organizationId);

      await request(app.getHttpServer())
        .post(`/api/organization-constants/`)
        .set('Cookie', adminUserData['tokenCookie'])
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .send({
          constant_name: 'email',
          value: 'test@tooljet.com',
          environments: [appEnvironments[0].id],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/organization-constants/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send({
          constant_name: 'test_token',
          value: 'test_token_value',
          environments: [appEnvironments[0].id],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/organization-constants/`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({
          constant_name: 'pi',
          value: '3.14',
          environments: [appEnvironments[0].id],
        })
        .expect(403);
    });
  });

  describe('PATCH /api/organization-constants/:id', () => {
    it('should be able to update an existing variable if group is admin or has update permission in the same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization: adminUserData.organization,
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerGroup = await getManager().findOneOrFail(GroupPermission, {
        where: { group: 'developer' },
      });

      await getManager().update(GroupPermission, developerGroup.id, {
        orgEnvironmentConstantCreate: true,
      });
      const appEnvironments = await createAppEnvironments(app, adminUserData.user.organizationId);

      const response = await createConstant(app, adminUserData, {
        constant_name: 'user_name',
        value: 'The Dev',
        environments: appEnvironments.map((env) => env.id),
      });

      for (const userData of [adminUserData, developerUserData]) {
        await request(app.getHttpServer())
          .patch(`/api/organization-constants/${response.body.constant.id}`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send({
            value: 'User',
            environment_id: appEnvironments[0].id,
          })
          .expect(200);

        const updatedVariable = await getManager().findOne(OrgEnvironmentConstantValue, {
          where: {
            organizationConstantId: response.body.constant.id,
            environmentId: appEnvironments[0].id,
          },
        });

        expect(updatedVariable.value).toEqual('User');
      }

      await request(app.getHttpServer())
        .patch(`/api/organization-constants/${response.body.constant.id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({
          value: 'Viewer',
          environment_id: appEnvironments[0].id,
        })
        .expect(403);
    });
  });

  describe('DELETE /api/organization-constants/:id', () => {
    it('should be able to delete an existing constant if group is admin or has delete permission in the same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization: adminUserData.organization,
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerGroup = await getManager().findOneOrFail(GroupPermission, {
        where: { group: 'developer' },
      });

      const appEnvironments = await createAppEnvironments(app, adminUserData.user.organizationId);

      await getManager().update(GroupPermission, developerGroup.id, {
        orgEnvironmentConstantDelete: true,
      });

      for (const userData of [adminUserData, developerUserData]) {
        const response = await createConstant(app, adminUserData, {
          constant_name: 'user_name',
          value: 'The Dev',
          environments: [appEnvironments[0]?.id],
        });

        const preCount = await getManager().count(OrgEnvironmentConstantValue);

        const x = await request(app.getHttpServer())
          .delete(`/api/organization-constants/${response.body.constant.id}?environmentId=${appEnvironments[0].id}`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send()
          .expect(200);

        const postCount = await getManager().count(OrgEnvironmentConstantValue);
        expect(postCount).toEqual(0);
      }

      const response = await createConstant(app, adminUserData, {
        constant_name: 'email',
        value: 'dev@tooljet.io',
        environments: [appEnvironments[0]?.id],
      });

      await request(app.getHttpServer())
        .delete(`/api/organization-constants/${response.body.constant.id}?environmentId=${appEnvironments[0].id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send()
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
