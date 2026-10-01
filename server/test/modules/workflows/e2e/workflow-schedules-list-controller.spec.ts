import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { User } from '@entities/user.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntity,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  buildTestSession,
} from 'test-helper';

/** @group workflows */
describe('WorkflowSchedulesController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let user: User;
    let appId: string;
    let scheduleId: string;
    let cookie: string[];

    const list = (query: string): request.Test =>
      request(app.getHttpServer())
        .get(`/api/workflow-schedules?${query}`)
        .set('Cookie', cookie)
        .set('tj-workspace-id', user.organizationId);

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
      ({ user } = await setupOrganizationAndUser(app, {
        email: 'schedules-list@tooljet.io',
        password: 'password',
        firstName: 'Schedules',
        lastName: 'List',
      }));
      const workflow = await createWorkflowForUser(app, user, 'Schedules list wf');
      const version = await createWorkflowApplicationVersion(app, workflow);
      const environment = await findEntity(AppEnvironment, {
        organizationId: user.organizationId,
        name: 'development',
      });
      appId = workflow.id;
      scheduleId = (
        await saveEntity(WorkflowSchedule, {
          workflowId: version.id,
          appId,
          environmentId: environment.id,
          name: 'Nightly',
          active: true,
          type: 'interval',
          timezone: 'UTC',
          details: { frequency: 'minute' },
        })
      ).id;
      ({ tokenCookie: cookie } = await buildTestSession(user, user.organizationId));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('GET /workflow-schedules | List a workflow schedules', () => {
      it('should return every schedule of the workflow as an array without paging params', async () => {
        const response = await list(`app_id=${appId}`).expect(200);

        expect(response.body).toMatchObject([{ id: scheduleId, name: 'Nightly' }]);
      });

      it('should return a page with its total when paging params are given', async () => {
        const response = await list(`app_id=${appId}&page=1&limit=8&search=night`).expect(200);

        expect(response.body).toMatchObject({ data: [{ id: scheduleId }], total: 1, page: 1, limit: 8 });
      });

      // APP stands for the seeded workflow's id.
      it.each([
        ['app_id is not a UUID', 'app_id=not-a-uuid'],
        ['environment_id is not a UUID', 'app_id=APP&environment_id=not-a-uuid&page=1&limit=8'],
        ['workflow_id is not a UUID', 'app_id=APP&workflow_id=not-a-uuid&page=1&limit=8'],
        ['page is below 1', 'app_id=APP&page=0&limit=8'],
        ['limit is above 100', 'app_id=APP&page=1&limit=101'],
        ['limit is not an integer', 'app_id=APP&page=1&limit=abc'],
      ])('should return 400 when %s', async (_case, query) => {
        await list(query.replace('APP', appId)).expect(400);
      });
    });
  });
});
