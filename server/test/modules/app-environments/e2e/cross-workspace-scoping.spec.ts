import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  buildTestSession,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createUser,
  initTestApp,
} from 'test-helper';

const EDITIONS: Array<{ label: string; edition: 'ee' | 'ce'; plan?: 'enterprise' }> = [
  { label: 'EE (plan: enterprise)', edition: 'ee', plan: 'enterprise' },
  { label: 'CE', edition: 'ce' },
];

/** @group platform */
describe('AppEnvironmentsController', () => {
  // EE overrides init, post-action and the list without calling super, so each edition runs its own implementation.
  describe.each(EDITIONS)('$label', ({ edition, plan }) => {
    describe('workspace scoping of client-supplied ids', () => {
      let app: INestApplication;
      let orgA: { id: string; cookie: string[]; appId: string; versionId: string; environmentId: string };
      let orgB: { id: string; appId: string; versionId: string; environmentId: string };

      const asWorkspaceA = (req: request.Test) => req.set('tj-workspace-id', orgA.id).set('Cookie', orgA.cookie);

      beforeAll(async () => {
        ({ app } = await initTestApp({ edition, plan }));

        const a = await createUser(app, { email: `env-scope-a-${edition}@tooljet.io` });
        const appA = await createApplication(app, { name: 'App A', user: a.user });
        const versionA = await createApplicationVersion(app, appA);
        const { tokenCookie } = await buildTestSession(a.user, a.organization.id);
        orgA = {
          id: a.organization.id,
          cookie: tokenCookie,
          appId: appA.id,
          versionId: versionA.id,
          environmentId: versionA.currentEnvironmentId,
        };

        const b = await createUser(app, { email: `env-scope-b-${edition}@tooljet.io` });
        const appB = await createApplication(app, { name: 'App B', user: b.user });
        const versionB = await createApplicationVersion(app, appB);
        orgB = {
          id: b.organization.id,
          appId: appB.id,
          versionId: versionB.id,
          environmentId: versionB.currentEnvironmentId,
        };
      });

      afterAll(async () => {
        await closeTestApp(app);
      }, 60_000);

      // The error body echoes the request `path`, i.e. the ids the caller sent themselves.
      const expectNothingOfWorkspaceB = ({ path: _echoedRequestPath, ...body }: Record<string, unknown>) => {
        const serialized = JSON.stringify(body);
        expect(serialized).not.toContain(orgB.appId);
        expect(serialized).not.toContain(orgB.versionId);
        expect(serialized).not.toContain(orgB.environmentId);
      };

      describe('GET /api/app-environments/init', () => {
        it('should return 404 for a version that belongs to another workspace', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer()).get('/api/app-environments/init').query({ editing_version_id: orgB.versionId })
          );

          expect(response.statusCode).toBe(404);
          expectNothingOfWorkspaceB(response.body);
        });

        it('should return the version for the caller own workspace', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer()).get('/api/app-environments/init').query({ editing_version_id: orgA.versionId })
          );

          expect(response.statusCode).toBe(200);
          expect(response.body.editorVersion).toMatchObject({ id: orgA.versionId, appId: orgA.appId });
        });
      });

      describe('GET /api/app-environments/:id/versions', () => {
        it('should return 404 for an app that belongs to another workspace, even with an own environment id', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer())
              .get(`/api/app-environments/${orgA.environmentId}/versions`)
              .query({ app_id: orgB.appId })
          );

          expect(response.statusCode).toBe(404);
          expectNothingOfWorkspaceB(response.body);
        });

        it('should return 400 instead of every version in the database when app_id is omitted', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer()).get(`/api/app-environments/${orgA.environmentId}/versions`)
          );

          expect(response.statusCode).toBe(400);
          expectNothingOfWorkspaceB(response.body);
        });

        it('should list the versions of an app in the caller own workspace', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer())
              .get(`/api/app-environments/${orgA.environmentId}/versions`)
              .query({ app_id: orgA.appId })
          );

          expect(response.statusCode).toBe(200);
          expect(response.body.appVersions).toEqual(
            expect.arrayContaining([expect.objectContaining({ id: orgA.versionId })])
          );
        });
      });

      describe('GET /api/app-environments', () => {
        it('should return 404 for an app that belongs to another workspace', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer()).get('/api/app-environments').query({ app_id: orgB.appId })
          );

          expect(response.statusCode).toBe(404);
          expectNothingOfWorkspaceB(response.body);
        });

        it('should list environments with version counts for an app in the caller own workspace', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer()).get('/api/app-environments').query({ app_id: orgA.appId })
          );

          expect(response.statusCode).toBe(200);
          expect(response.body.environments).toEqual(
            expect.arrayContaining([expect.objectContaining({ id: orgA.environmentId, app_versions_count: 1 })])
          );
        });
      });

      describe('POST /api/app-environments/post-action/:action', () => {
        it.each(['environment_changed', 'version_deleted'])(
          'should return 404 for %s with an app that belongs to another workspace',
          async (action) => {
            const response = await asWorkspaceA(
              request(app.getHttpServer())
                .post(`/api/app-environments/post-action/${action}`)
                .send({ appId: orgB.appId, editorEnvironmentId: orgA.environmentId })
            );

            expect(response.statusCode).toBe(404);
            expectNothingOfWorkspaceB(response.body);
          }
        );

        it.each(['environment_changed', 'version_deleted'])(
          'should return 404 for %s with an environment that belongs to another workspace',
          async (action) => {
            const response = await asWorkspaceA(
              request(app.getHttpServer())
                .post(`/api/app-environments/post-action/${action}`)
                .send({ appId: orgA.appId, editorEnvironmentId: orgB.environmentId })
            );

            expect(response.statusCode).toBe(404);
            expectNothingOfWorkspaceB(response.body);
          }
        );

        it('should resolve the version for environment_changed within the caller own workspace', async () => {
          const response = await asWorkspaceA(
            request(app.getHttpServer())
              .post('/api/app-environments/post-action/environment_changed')
              .send({ appId: orgA.appId, editorEnvironmentId: orgA.environmentId })
          );

          expect(response.statusCode).toBe(201);
          expect(response.body.editorVersion).toMatchObject({ id: orgA.versionId });
        });
      });
    });
  });
});
