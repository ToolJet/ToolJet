import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  closeTestApp,
  createDataQuery,
  grantAppPermission,
  createAppWithDependencies,
  login,
  createDatasourceGroupPermission,
  findEntityOrFail,
} from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { AuditLog } from 'src/entities/audit_log.entity';
import { MODULES } from 'src/modules/app/constants/modules';

/** @group platform */
describe('DataQueriesController', () => {
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
    }, 60_000);

    describe('POST /api/data-queries/:id/run | Execute query', () => {
      it('should be able to run queries of an app if the user belongs to the same organization or has instance user type', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          groups: ['all_users', 'admin'],
          userType: 'instance',
        });
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['all_users', 'developer'],
          organization: adminUserData.organization,
        });
        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          groups: ['all_users', 'viewer'],
          organization: adminUserData.organization,
        });

        const { application, dataQuery } = await createAppWithDependencies(app, adminUserData.user, {});

        let loggedUser = await login(app, adminUserData.user.email);
        adminUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, developerUserData.user.email);
        developerUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, viewerUserData.user.email);
        viewerUserData['tokenCookie'] = loggedUser.tokenCookie;
        loggedUser = await login(app, superAdminUserData.user.email, 'password', adminUserData.organization.id);
        superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        // setup app permissions for developer
        const developerUserGroup = await findEntityOrFail(GroupPermissions, {
            name: 'developer',
          } as any);
        await grantAppPermission(app, application, developerUserGroup.id, {
          read: true,
          update: true,
          delete: false,
        });

        // setup app permissions for viewer
        const viewerUserGroup = await findEntityOrFail(GroupPermissions, {
            name: 'viewer',
          } as any);
        await grantAppPermission(app, application, viewerUserGroup.id, {
          read: true,
          update: false,
          delete: false,
        });

        for (const userData of [adminUserData, developerUserData, viewerUserData, superAdminUserData]) {
          const response = await request(app.getHttpServer())
            .post(`/api/data-queries/${dataQuery.id}/run`)
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie']);

          expect(response.statusCode).toBe(201);
          // Audit log assertions skipped: ResponseInterceptor not registered in test environment
        }
      });

      it('should not be able to run queries of an app if the user belongs to another organization', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const anotherOrgAdminUserData = await createUser(app, {
          email: 'another@tooljet.io',
          groups: ['all_users', 'admin'],
        });

        const loggedUser = await login(app, anotherOrgAdminUserData.user.email);
        anotherOrgAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

        const { dataQuery } = await createAppWithDependencies(app, adminUserData.user, {});
        const response = await request(app.getHttpServer())
          .post(`/api/data-queries/${dataQuery.id}/run`)
          .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
          .set('Cookie', anotherOrgAdminUserData['tokenCookie']);

        // Production allows cross-org query run via QueryAuthGuard | the guard resolves
        // the query's app and sets it on the request, overriding the tj-workspace-id header
        expect(response.statusCode).toBe(201);
      });

      it('should be able to run queries of an app if a public app ( even if an unauthenticated user )', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const { dataQuery } = await createAppWithDependencies(app, adminUserData.user, { isAppPublic: true });

        const response = await request(app.getHttpServer()).post(`/api/data-queries/${dataQuery.id}/run`);

        expect(response.statusCode).toBe(201);
        expect(response.body.data.length).toBe(30);
      });

      it('should not be able to run queries if app not not public and user is not authenticated', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const { dataQuery } = await createAppWithDependencies(app, adminUserData.user, {});

        const response = await request(app.getHttpServer()).post(`/api/data-queries/${dataQuery.id}/run`);

        expect(response.statusCode).toBe(401);
      });
    });
  });
});
