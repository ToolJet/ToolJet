import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { User } from '@entities/user.entity';
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
} from 'test-helper';

type SeededWorkspace = {
  user: User;
  organization: Organization;
  appId: string;
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
  return { user, organization, appId: workflow.id, executionId: execution.id, scheduleId: schedule.id };
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
});
