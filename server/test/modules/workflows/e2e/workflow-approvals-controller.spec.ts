import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';

/** @group workflows */
describe('workflow-approvals controller', () => {
  let app: INestApplication;
  let appVersionId: string;
  let userId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    jest.spyOn(app.get(WorkflowExecutionQueueService, { strict: false }), 'enqueue').mockResolvedValue(undefined);
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-ctrl@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Ctrl',
    });
    userId = user.id;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL ctrl wf');
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedPending() {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: userId,
      logs: [],
    });
    const node = await saveEntity(WorkflowExecutionNode, {
      type: 'human',
      executed: false,
      result: '',
      state: {},
      idOnWorkflowDefinition: 'human1',
      workflowExecutionId: execution.id,
      definition: {
        nodeType: 'human',
        nodeName: 'approval1',
        outcomes: [{ key: 'approved' }],
        inputSchema: [],
      },
    });
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: `tok-ctrl-${Date.now()}`,
      status: 'pending',
      approversSnapshot: { tokenBypass: true },
      expiresAt: null,
    });
  }

  it('resolves via POST /:token/resolve without a session (token-bypass)', async () => {
    const req = await seedPending();
    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${req.token}/resolve`)
      .send({ outcome: 'approved', input: {} })
      .expect(201);
  });

  it('returns 404 for an unknown token', async () => {
    await request(app.getHttpServer()).get('/api/workflow-approvals/no-such-token').expect(404);
  });
});

// GATING NOTE: `POST /:token/resolve` (ee/workflows/controllers/workflow-approvals.controller.ts) carries
// only `@InitFeature(FEATURE_KEY.HUMAN_IN_THE_LOOP)` -- unlike `:id/cancel`, it does NOT apply
// `FeatureAbilityGuard`. `@InitFeature`'s `tjFeatureId` metadata is only read inside
// `AbilityGuard.canActivate` (src/modules/app/guards/ability.guard.ts), so without that guard on the
// route the license/feature check never runs for `resolve`. In CE, module registration
// (WorkflowsModule.register -> getImportPath()) swaps in the CE stub controller
// (src/modules/workflows/controllers/workflow-approvals.controller.ts), whose `resolve()` body is an
// unconditional `throw new Error('Method not implemented.')`. `AllExceptionsFilter` maps a bare `Error`
// to a generic 500, not a 403 feature gate. This block asserts the behavior actually observed rather
// than an assumed 403, per the test brief's contingency for this case.
describe('workflow-approvals controller — CE edition', () => {
  let ceApp: INestApplication;

  beforeAll(async () => {
    ({ app: ceApp } = await initTestApp({ edition: 'ce', withWorkflows: true }));
  });
  afterAll(async () => {
    await closeTestApp(ceApp);
  }, 60000);

  it('returns 500 "Method not implemented." for POST /:token/resolve (no FeatureAbilityGuard gates this route in CE)', async () => {
    const response = await request(ceApp.getHttpServer())
      .post('/api/workflow-approvals/any-token/resolve')
      .send({ outcome: 'approved', input: {} });
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ statusCode: 500, message: 'Method not implemented.' });
  });
});
