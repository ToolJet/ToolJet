/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, createGroupPermission, authenticateUser } from '../test.helper';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { randomInt } from 'crypto';

const createVariable = async (app: INestApplication, adminUserData: any, body: any) => {
  return await request(app.getHttpServer())
    .post(`/api/organization-variables/`)
    .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
    .set('Cookie', adminUserData['tokenCookie'])
    .send(body);
};

// TODO: OrgEnvironmentVariable entity and /api/organization-variables/ controller have been removed.
// Organization constants now handle both constants and secrets via /api/organization-constants/.
describe.skip('organization environment variables controller', () => {
  let app: INestApplication;
  let defaultDataSource: TypeOrmDataSource;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
    defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
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

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['admin', 'all_users'],
        userType: 'instance',
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

      loggedUser = await authenticateUser(app, superAdminUserData.user.email);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

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

      await request(app.getHttpServer())
        .get(`/api/organization-variables/`)
        .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
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
    it('should be able to create a new variable if the user is an admin/super admin or has create permission in the same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['admin', 'all_users'],
        userType: 'instance',
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

      const developerGroup = await defaultDataSource.manager.findOneOrFail(GroupPermissions, {
        where: { name: 'developer' },
      });

      await defaultDataSource.manager.update(GroupPermissions, developerGroup.id, {
        orgConstantCRUD: true,
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'dev@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, superAdminUserData.user.email);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

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

      await request(app.getHttpServer())
        .post(`/api/organization-variables/`)
        .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
        .send({ variable_name: 'pi', variable_type: 'server', value: '3.14', encrypted: true })
        .expect(201);
    });
  });

  describe('PATCH /api/organization-variables/:id', () => {
    it('should be able to update an existing variable if user is an admin/super admin or has update permission in the same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });
      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['admin', 'all_users'],
        userType: 'instance',
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

      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerGroup = await defaultDataSource.manager.findOneOrFail(GroupPermissions, {
        where: { name: 'developer' },
      });

      await defaultDataSource.manager.update(GroupPermissions, developerGroup.id, {
        orgConstantCRUD: true,
      });

      const response = await createVariable(app, adminUserData, {
        variable_name: 'email',
        value: 'test@tooljet.io',
        variable_type: 'server',
        encrypted: true,
      });

      for (const userData of [adminUserData, developerUserData, superAdminUserData]) {
        await request(app.getHttpServer())
          .patch(`/api/organization-variables/${response.body.variable.id}`)
          .set('tj-workspace-id', adminUserData.organization.id)
          .set('Cookie', userData['tokenCookie'])
          .send({ variable_name: 'secret_email' })
          .expect(200);

        const updatedVariable = await defaultDataSource.manager.findOne(OrgEnvironmentVariable, { where: { id: response.body.variable.id } });

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
    it('should be able to delete an existing variable if the user is an admin/super admin or has delete permission in the same organization', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const developerUserData = await createUser(app, {
        email: 'dev@tooljet.io',
        groups: ['all_users', 'developer'],
        organization: adminUserData.organization,
      });
      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
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

      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const developerGroup = await defaultDataSource.manager.findOneOrFail(GroupPermissions, {
        where: { name: 'developer' },
      });

      await defaultDataSource.manager.update(GroupPermissions, developerGroup.id, {
        orgConstantCRUD: true,
      });

      for (const userData of [adminUserData, developerUserData, superAdminUserData]) {
        const response = await createVariable(app, adminUserData, {
          variable_name: 'email',
          value: 'test@tooljet.io',
          variable_type: 'server',
          encrypted: true,
        });

        const preCount = await defaultDataSource.manager.count(OrgEnvironmentVariable);

        await request(app.getHttpServer())
          .delete(`/api/organization-variables/${response.body.variable.id}`)
          .set('tj-workspace-id', adminUserData.organization.id)
          .set('Cookie', userData['tokenCookie'])
          .send()
          .expect(200);

        const postCount = await defaultDataSource.manager.count(OrgEnvironmentVariable);
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
