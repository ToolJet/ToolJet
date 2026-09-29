import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { WORKFLOW_SCHEDULE_QUEUE } from '@modules/workflows/constants';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  buildTestSession,
  findEntity,
  updateEntity,
} from 'test-helper';

type SeededWorkspace = {
  user: User;
  organization: Organization;
  appId: string;
  versionId: string;
  environmentId: string;
  executionId: string;
  scheduleId: string;
};

const seedWorkspace = async (app: INestApplication, email: string, workflowName: string): Promise<SeededWorkspace> => {
  const { user, organization } = await setupOrganizationAndUser(app, {
    email,
    password: 'password',
    firstName: 'Workspace',
    lastName: 'Routes',
  });
  const workflow = await createWorkflowForUser(app, user, workflowName);
  const version = await createWorkflowApplicationVersion(app, workflow);
  const environment = await findEntity(AppEnvironment, { organizationId: user.organizationId, name: 'development' });
  const schedule = await saveEntity(WorkflowSchedule, {
    workflowId: version.id,
    appId: workflow.id,
    environmentId: environment.id,
    active: true,
    type: 'interval',
    timezone: 'UTC',
    details: { frequency: 'minute' },
  });
  const execution = await saveEntity(WorkflowExecution, {
    appVersionId: version.id,
    startNodeId: null,
    executed: true,
    status: 'success',
    executingUserId: user.id,
    logs: [],
    organizationId: user.organizationId,
    appId: workflow.id,
    scheduleId: schedule.id,
  });
  return {
    user,
    organization,
    appId: workflow.id,
    versionId: version.id,
    environmentId: environment.id,
    executionId: execution.id,
    scheduleId: schedule.id,
  };
};

/** @group workflows */
describe('WorkflowExecutionsController workspace routes', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let own: SeededWorkspace;
    let other: SeededWorkspace;

    let ownCookie: string[];

    const asOwner = (req: request.Test): request.Test =>
      req.set('Cookie', ownCookie).set('tj-workspace-id', own.user.organizationId);

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
      own = await seedWorkspace(app, 'executions-workspace-own@tooljet.io', 'Own workspace wf');
      other = await seedWorkspace(app, 'executions-workspace-other@tooljet.io', 'Other workspace wf');
      ({ tokenCookie: ownCookie } = await buildTestSession(own.user, own.user.organizationId));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('GET /workflow_executions/workspace | List workspace runs', () => {
      it('should return 401 without a session', async () => {
        await request(app.getHttpServer()).get('/api/workflow_executions/workspace').expect(401);
      });

      // Also pins route order: resolved as `:id`, this path would be a single-execution lookup.
      it("should return only the caller's workspace runs", async () => {
        const response = await asOwner(request(app.getHttpServer()).get('/api/workflow_executions/workspace')).expect(
          200
        );

        expect(response.body).toMatchObject({
          executions: [
            {
              id: own.executionId,
              workflow: { id: own.appId, name: 'Own workspace wf' },
              status: 'success',
              executed: true,
              // Unnamed, as every schedule created before names existed is.
              schedule: { id: own.scheduleId, name: 'Every minute' },
            },
          ],
          meta: { page: 1, perPage: 15, total: 1 },
        });
      });

      it('should return 403 for an end user without the workspace executions grant', async () => {
        const { user: endUser } = await createUser(app, {
          email: 'executions-workspace-end-user@tooljet.io',
          groups: ['end-user'],
          organization: own.organization,
        });
        const { tokenCookie } = await buildTestSession(endUser, own.user.organizationId);

        await request(app.getHttpServer())
          .get('/api/workflow_executions/workspace')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', own.user.organizationId)
          .expect(403);
      });
    });

    describe('GET /workflow_executions/workspace/upcoming | List upcoming scheduled runs', () => {
      it("should return only the caller's workspace schedules", async () => {
        const response = await asOwner(
          request(app.getHttpServer()).get('/api/workflow_executions/workspace/upcoming')
        ).expect(200);

        expect(response.body).toMatchObject({
          upcoming: [
            {
              scheduleId: own.scheduleId,
              workflow: { id: own.appId, name: 'Own workspace wf' },
              cadence: expect.any(String),
              timezone: 'UTC',
              nextRuns: expect.any(Array),
              registered: expect.any(Boolean),
            },
          ],
        });
        expect(response.body.upcoming).toHaveLength(1);
      });

      it('should report whether BullMQ holds a job scheduler for each schedule', async () => {
        const queue = app.get<Queue>(getQueueToken(WORKFLOW_SCHEDULE_QUEUE));
        const unregistered = await saveEntity(WorkflowSchedule, {
          workflowId: own.versionId,
          appId: own.appId,
          environmentId: own.environmentId,
          active: true,
          type: 'interval',
          timezone: 'UTC',
          details: { frequency: 'minute' },
        });
        await queue.upsertJobScheduler(own.scheduleId, { pattern: '* * * * *' }, { name: 'registered-check' });
        try {
          const response = await asOwner(
            request(app.getHttpServer()).get('/api/workflow_executions/workspace/upcoming')
          ).expect(200);

          const registeredById = Object.fromEntries(
            response.body.upcoming.map((run: { scheduleId: string; registered: boolean }) => [
              run.scheduleId,
              run.registered,
            ])
          );
          expect(registeredById).toEqual({ [own.scheduleId]: true, [unregistered.id]: false });
        } finally {
          await queue.removeJobScheduler(own.scheduleId);
        }
      });

      it('should leave out schedules of a disabled workflow', async () => {
        const disabled = await createWorkflowForUser(app, own.user, 'Disabled wf');
        const version = await createWorkflowApplicationVersion(app, disabled);
        await updateEntity(App, disabled.id, { isMaintenanceOn: false });
        const environment = await findEntity(AppEnvironment, {
          organizationId: own.user.organizationId,
          name: 'development',
        });
        await saveEntity(WorkflowSchedule, {
          workflowId: version.id,
          appId: disabled.id,
          environmentId: environment.id,
          active: true,
          type: 'interval',
          timezone: 'UTC',
          details: { frequency: 'minute' },
        });

        const response = await asOwner(
          request(app.getHttpServer()).get('/api/workflow_executions/workspace/upcoming')
        ).expect(200);

        expect(response.body.upcoming.map((run: { scheduleId: string }) => run.scheduleId)).toEqual([own.scheduleId]);
      });

      it.each([['app_id'], ['folder_id'], ['environment_id']])(
        'should return 400 for a %s that is not a UUID',
        async (param) => {
          await asOwner(
            request(app.getHttpServer()).get(`/api/workflow_executions/workspace/upcoming?${param}=not-a-uuid`)
          ).expect(400);
        }
      );

      it('should return 403 for an end user without the workspace executions grant', async () => {
        const { user: endUser } = await createUser(app, {
          email: 'executions-upcoming-end-user@tooljet.io',
          groups: ['end-user'],
          organization: own.organization,
        });
        const { tokenCookie } = await buildTestSession(endUser, own.user.organizationId);

        await request(app.getHttpServer())
          .get('/api/workflow_executions/workspace/upcoming')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', own.user.organizationId)
          .expect(403);
      });
    });

    describe('POST /workflow_executions/workspace/states | Poll job state', () => {
      it("should accept the caller's own execution ids", async () => {
        const response = await asOwner(request(app.getHttpServer()).post('/api/workflow_executions/workspace/states'))
          .send({ executionIds: [own.executionId] })
          .expect(201);

        // A seeded run has no BullMQ job, and runs without a job are left out of the map.
        expect(response.body).toEqual({});
      });

      it.each([
        ['the body is missing', undefined],
        ['executionIds is not an array', { executionIds: 'not-an-array' }],
        ['an id is not a UUID', { executionIds: ['not-a-uuid'] }],
        ['more than 100 ids are sent', { executionIds: Array.from({ length: 101 }, () => randomUUID()) }],
      ])('should return 400 when %s', async (_case, body) => {
        const req = asOwner(request(app.getHttpServer()).post('/api/workflow_executions/workspace/states'));
        await (body === undefined ? req : req.send(body)).expect(400);
      });

      it('should return 403 when an id belongs to another workspace', async () => {
        await asOwner(request(app.getHttpServer()).post('/api/workflow_executions/workspace/states'))
          .send({ executionIds: [own.executionId, other.executionId] })
          .expect(403);
      });

      it('should return 403 for an end user without the workspace executions grant', async () => {
        const { user: endUser } = await createUser(app, {
          email: 'executions-states-end-user@tooljet.io',
          groups: ['end-user'],
          organization: own.organization,
        });
        const { tokenCookie } = await buildTestSession(endUser, own.user.organizationId);

        await request(app.getHttpServer())
          .post('/api/workflow_executions/workspace/states')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', own.user.organizationId)
          .send({ executionIds: [own.executionId] })
          .expect(403);
      });
    });
  });

  describe('CE', () => {
    let ceApp: INestApplication;
    let ceUser: User;
    let ceCookie: string[];

    beforeAll(async () => {
      ({ app: ceApp } = await initTestApp({ edition: 'ce', withWorkflows: true }));
      ({ user: ceUser } = await setupOrganizationAndUser(ceApp, {
        email: 'executions-workspace-ce@tooljet.io',
        password: 'password',
        firstName: 'Workspace',
        lastName: 'CE',
      }));
      ({ tokenCookie: ceCookie } = await buildTestSession(ceUser, ceUser.organizationId));
    });

    afterAll(async () => {
      await closeTestApp(ceApp);
    }, 60000);

    it.each([
      ['GET', '/api/workflow_executions/workspace'],
      ['GET', '/api/workflow_executions/workspace/upcoming'],
      ['POST', '/api/workflow_executions/workspace/states'],
    ])('should return 501 for %s %s', async (method, path) => {
      const server = request(ceApp.getHttpServer());
      const req = method === 'GET' ? server.get(path) : server.post(path).send({ executionIds: [] });
      const response = await req.set('Cookie', ceCookie).set('tj-workspace-id', ceUser.organizationId);
      expect(response.statusCode).toBe(501);
    });
  });
});
