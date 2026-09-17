import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  releaseWorkflowVersion,
  login,
} from 'test-helper';

/**
 * Task 2.4 (§5.4): a synchronous trigger that suspends at a human node must return a
 * `waiting` acknowledgment instead of letting WorkflowSuspendedSignal escape as a 500.
 *
 * Implementer note: the sync try/catch this test exercises lives in the `trigger()` handler
 * (`POST /api/workflow_executions/:id/trigger`), not the plain `POST /api/workflow_executions`
 * `create()` handler -- `create()` has no syncExecution branching at all. The task brief's
 * illustrative snippet posts to the plain collection route; this test targets `/trigger`
 * instead, since that is where the sync branch (and the try/catch this task modifies)
 * actually exists. See `workflow-executions.controller.ts` `trigger()`.
 *
 * @group workflows
 */
describe('WorkflowExecutionsController', () => {
  describe('EE (plan: enterprise) | POST /api/workflow_executions/:id/trigger | sync suspend ack', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** Builds a released workflow version: start -> human -> response(approved). */
    const seedHumanNodeWorkflow = async (user: any) => {
      const workflowApp = await createWorkflowForUser(app, user, `Sync Suspend Ack ${Date.now()}`);

      const appVersion = await createWorkflowApplicationVersion(app, workflowApp, {
        definition: {
          nodes: [
            {
              id: 'start-1',
              type: 'input',
              data: { nodeType: 'start', label: 'Start trigger' },
            },
            {
              // `type: 'human'` and `data.nodeType: 'human'` mirror the shape processed by
              // WorkflowExecutionsService.processHumanNode (ee/workflows/services/
              // workflow-executions.service.ts) -- see workflow-human-node.spec.ts for the
              // equivalent WorkflowExecutionNode-level seed this test builds via the
              // AppVersion definition (i.e. through the real HTTP trigger path) instead.
              id: 'human-1',
              type: 'human',
              data: {
                nodeType: 'human',
                nodeName: 'approval1',
                approvers: { users: [user.id], groups: [], dynamic: '', tokenBypass: true },
                outcomes: [
                  { key: 'approved', label: 'Approve' },
                  { key: 'rejected', label: 'Reject' },
                ],
                inputSchema: [],
                timeout: { enabled: false },
              },
            },
            {
              id: 'response-1',
              type: 'output',
              data: {
                nodeType: 'response',
                label: 'Response',
                code: 'return { message: "approved" }',
                nodeName: 'response1',
              },
            },
          ],
          edges: [
            { id: 'edge-1', source: 'start-1', target: 'human-1', type: 'workflow' },
            { id: 'edge-2', source: 'human-1', target: 'response-1', type: 'workflow', sourceHandle: 'approved' },
          ],
          queries: [],
          webhookParams: [],
          defaultParams: '{}',
        } as any,
      });

      await releaseWorkflowVersion(workflowApp, appVersion);

      return { workflowApp, appVersion };
    };

    it('returns a waiting acknowledgment when a sync-triggered run suspends at a human node', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'sync-suspend-ack@tooljet.io',
        password: 'password',
        firstName: 'Sync',
        lastName: 'Suspend',
      });
      user.organizationId = user.organizationId || user.defaultOrganizationId;

      const { workflowApp, appVersion } = await seedHumanNodeWorkflow(user);
      const { tokenCookie } = await login(app, user.email);

      const res = await request(app.getHttpServer())
        .post(`/api/workflow_executions/${workflowApp.id}/trigger`)
        .set('tj-workspace-id', user.organizationId)
        .set('Cookie', tokenCookie)
        .send({
          executeUsing: 'version',
          appVersionId: appVersion.id,
          environmentId: appVersion.currentEnvironmentId,
          params: {},
          syncExecution: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.result).toMatchObject({ executionStatus: 'waiting' });
      expect(res.body.result.executionId).toBeTruthy();
      expect(res.body.result.requestId).toBeTruthy();
    });
  });
});
