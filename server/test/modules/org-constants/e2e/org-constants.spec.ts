/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  closeTestApp,
  createGroupPermission,
  login,
  ensureAppEnvironments,
  findEntityOrFail,
  findEntity,
  updateEntity,
  countEntities,
} from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';

const createConstant = async (app: INestApplication, adminUserData: any, body: any) => {
  return await request(app.getHttpServer())
    .post(`/api/organization-constants/`)
    .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
    .set('Cookie', adminUserData['tokenCookie'])
    .send(body);
};

/** @group platform */
describe('OrgConstantsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  describe('EE (plan: enterprise)', () => {
    describe('GET /api/organization-constants/decrypted | List constants', () => {
      it('should allow only authenticated users to list org users', async () => {
        await request(app.getHttpServer()).get('/api/organization-constants/decrypted').expect(401);
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

        const appEnvironments = await ensureAppEnvironments(app, adminUserData.user.organizationId);

        const bodyArray = [
          {
            constant_name: 'user_name',
            value: 'The Dev',
            type: 'Global',
            environments: appEnvironments.map((env) => env.id),
          },
        ];

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'developer@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'viewer@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const constantArray = [];
        for (const body of bodyArray) {
          const result = await createConstant(app, adminUserData, body);
          constantArray.push(result.body.constant);
        }

        // developer and viewer lack orgConstantCRUD permission,
        // so GET /decrypted returns 403
        await request(app.getHttpServer())
          .get(`/api/organization-constants/decrypted`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie'])
          .send()
          .expect(403);

        await request(app.getHttpServer())
          .get(`/api/organization-constants/decrypted`)
          .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
          .set('Cookie', viewerUserData['tokenCookie'])
          .send()
          .expect(403);

        const listResponse = await request(app.getHttpServer())
          .get(`/api/organization-constants/decrypted`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send()
          .expect(200);

        listResponse.body.constants.map((constant: any, index: any) => {
          const orgConstant = JSON.parse(JSON.stringify(constant));

          delete orgConstant.createdAt;
          delete orgConstant.id;
          delete orgConstant.type;

          // Strip dynamic ids from each value entry
          if (orgConstant.values) {
            orgConstant.values = orgConstant.values.map(({ id, ...rest }: any) => rest);
          }

          const expectedConstant = {
            name: bodyArray[index].constant_name,
            values: bodyArray[index].environments.map((envId: any) => {
              const appEnvironment = appEnvironments.find((env) => env.id === envId);
              return {
                environmentName: appEnvironment.name,
                value: bodyArray[index].value,
              };
            }),
          };

          expect(orgConstant).toEqual(expectedConstant);
        });
      });
    });

    describe('POST /api/organization-constants | Create constant', () => {
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

        const developerGroup = await findEntityOrFail(GroupPermissions, {
          name: 'developer',
        });

        await updateEntity(GroupPermissions, developerGroup.id, {
          orgConstantCRUD: true,
        });

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'dev@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'viewer@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const appEnvironments = await ensureAppEnvironments(app, adminUserData.user.organizationId);

        await request(app.getHttpServer())
          .post(`/api/organization-constants/`)
          .set('Cookie', adminUserData['tokenCookie'])
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .send({
            constant_name: 'email',
            value: 'test@tooljet.com',
            type: 'Global',
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
            type: 'Global',
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
            type: 'Global',
            environments: [appEnvironments[0].id],
          })
          .expect(403);
      });
    });

    describe('PATCH /api/organization-constants/:id | Update constant', () => {
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

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'dev@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'viewer@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const developerGroup = await findEntityOrFail(GroupPermissions, {
          name: 'developer',
        });

        await updateEntity(GroupPermissions, developerGroup.id, {
          orgConstantCRUD: true,
        });
        const appEnvironments = await ensureAppEnvironments(app, adminUserData.user.organizationId);

        const response = await createConstant(app, adminUserData, {
          constant_name: 'user_name',
          value: 'The Dev',
          type: 'Global',
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

          // Values are stored encrypted in the DB — read back through the decrypted
          // listing endpoint (as admin) to confirm the value actually changed, not
          // just that some (possibly stale) ciphertext is present.
          const decryptedResponse = await request(app.getHttpServer())
            .get('/api/organization-constants/decrypted')
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', adminUserData['tokenCookie'])
            .expect(200);

          const updatedConstant = decryptedResponse.body.constants.find((c: any) => c.id === response.body.constant.id);
          const updatedValueEntry = updatedConstant.values.find(
            (v: any) => v.environmentName === appEnvironments[0].name
          );
          expect(updatedValueEntry.value).toBe('User');
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

    describe('DELETE /api/organization-constants/:id | Delete constant', () => {
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

        let loggedUser = await login(app);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'dev@tooljet.io');
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;

        loggedUser = await login(app, 'viewer@tooljet.io');
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

        const developerGroup = await findEntityOrFail(GroupPermissions, {
          name: 'developer',
        });

        const appEnvironments = await ensureAppEnvironments(app, adminUserData.user.organizationId);

        await updateEntity(GroupPermissions, developerGroup.id, {
          orgConstantCRUD: true,
        });

        for (const userData of [adminUserData, developerUserData]) {
          const response = await createConstant(app, adminUserData, {
            constant_name: 'user_name',
            value: 'The Dev',
            type: 'Global',
            environments: [appEnvironments[0]?.id],
          });

          const preCount = await countEntities(OrgEnvironmentConstantValue);

          const x = await request(app.getHttpServer())
            .delete(`/api/organization-constants/${response.body.constant.id}?environmentId=${appEnvironments[0].id}`)
            .set('tj-workspace-id', userData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie'])
            .send()
            .expect(200);

          const postCount = await countEntities(OrgEnvironmentConstantValue);
          expect(postCount).toEqual(0);
        }

        const response = await createConstant(app, adminUserData, {
          constant_name: 'email',
          value: 'dev@tooljet.io',
          type: 'Global',
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
  });
});
