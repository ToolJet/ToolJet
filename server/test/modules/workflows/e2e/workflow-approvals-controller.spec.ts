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
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    jest.spyOn(app.get(WorkflowExecutionQueueService), 'enqueue').mockResolvedValue(undefined);
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
