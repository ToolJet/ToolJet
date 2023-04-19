/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, createGroupPermission, authenticateUser } from '../test.helper';
import { getManager } from 'typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';

const createVariable = async (app: INestApplication, adminUserData: any, body: any) => {
  return await request(app.getHttpServer())
    .post(`/api/organization-variables/`)
    .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
    .set('Cookie', adminUserData['tokenCookie'])
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

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const variableArray = [];
      for (const body in bodyArray) {
        const result = await createVariable(app, adminUserData, body);
        variableArray.push(result.body.variable);
      }

      await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send()
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send()
        .expect(200);

      const listResponse = await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send()
        .expect(200);

      listResponse.body.variables.map((variable: any, index: any) => {
        expect(variable).toStrictEqual({
          variableName: bodyArray[index].variable_name,
          value: variable.variableType === 'server' ? undefined : bodyArray[index].value,
          variableType: bodyArray[index].variable_type,
          encrypted: bodyArray[index].encrypted,
        });
      });
    });
  });

  describe('POST /api/organization-variables/', () => {
    it('should be able to create a new variable if group is admin or has create permission in the same organization', async () => {
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
        orgEnvironmentVariableCreate: true,
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('Cookie', adminUserData['tokenCookie'])
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .send({ variable_name: 'email', variable_type: 'server', value: 'test@tooljet.io', encrypted: true })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send({ variable_name: 'name', variable_type: 'client', value: 'demo user', encrypted: false })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({ variable_name: 'pi', variable_type: 'server', value: '3.14', encrypted: true })
        .expect(403);
    });
  });

  describe('PATCH /api/organization-variables/:id', () => {
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
        orgEnvironmentVariableUpdate: true,
      });

      const response = await createVariable(app, adminUserData, {
        variable_name: 'email',
        value: 'test@tooljet.io',
        variable_type: 'server',
        encrypted: true,
      });

      for (const userData of [adminUserData, developerUserData]) {
        await request(app.getHttpServer())
          .patch(`/api/organization-variables/${response.body.variable.id}`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send({ variable_name: 'secret_email' })
          .expect(200);

        const updatedVariable = await getManager().findOne(OrgEnvironmentVariable, response.body.variable.id);

        expect(updatedVariable.variableName).toEqual('secret_email');
      }

      await request(app.getHttpServer())
        .patch(`/api/organization-variables/${response.body.variable.id}`)
        .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
        .set('Cookie', viewerUserData['tokenCookie'])
        .send({ variable_name: 'email', value: 'test3@tooljet.io' })
        .expect(403);
    });
  });

  describe('DELETE /api/organization-variables/:id', () => {
    it('should be able to delete an existing variable if group is admin or has delete permission in the same organization', async () => {
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
        orgEnvironmentVariableDelete: true,
      });

      for (const userData of [adminUserData, developerUserData]) {
        const response = await createVariable(app, adminUserData, {
          variable_name: 'email',
          value: 'test@tooljet.io',
          variable_type: 'server',
          encrypted: true,
        });

        const preCount = await getManager().count(OrgEnvironmentVariable);

        await request(app.getHttpServer())
          .delete(`/api/organization-variables/${response.body.variable.id}`)
          .set('tj-workspace-id', userData.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send()
          .expect(200);

        const postCount = await getManager().count(OrgEnvironmentVariable);
        expect(postCount).toEqual(preCount - 1);
      }

      const response = await createVariable(app, adminUserData, {
        variable_name: 'email',
        value: 'test@tooljet.io',
        variable_type: 'server',
        encrypted: true,
      });

      await request(app.getHttpServer())
        .delete(`/api/organization-variables/${response.body.variable.id}`)
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
