import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { WorkflowApprovalRequestRepository } from '@modules/workflows/repositories/workflow-approval-request.repository';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntity,
  buildTestSession,
  updateEntity,
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
  let organizationId: string;
  let signedInUser: User;
  let workflowAppId: string;

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
    organizationId = user.organizationId;
    signedInUser = user;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL ctrl wf');
    workflowAppId = workflowApp.id;
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedPending(
    approversSnapshot: Record<string, unknown> = { tokenBypass: true },
    inputSchema: Array<Record<string, unknown>> = []
  ) {
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
        inputSchema,
      },
    });
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: `tok-ctrl-${Date.now()}`,
      status: 'pending',
      approversSnapshot,
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

  it('resolves via POST /:token/resolve as the signed-in approver when token bypass is off', async () => {
    const req = await seedPending({ users: [userId], groups: [], emails: [], tokenBypass: false });
    const { tokenCookie } = await buildTestSession(signedInUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${req.token}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved', input: {} })
      .expect(201);

    expect(await findEntity(WorkflowApprovalRequest, { id: req.id })).toMatchObject({
      status: 'resolved',
      resolvedByUserId: userId,
    });
  });

  it('returns 403 from POST /:token/resolve without a session when token bypass is off', async () => {
    const req = await seedPending({ users: [userId], groups: [], emails: [], tokenBypass: false });

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${req.token}/resolve`)
      .send({ outcome: 'approved', input: {} })
      .expect(403);
  });

  it('treats an invalid session cookie as anonymous on POST /:token/resolve instead of returning 401', async () => {
    const req = await seedPending();

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${req.token}/resolve`)
      .set('Cookie', ['tj_auth_token=not-a-valid-jwt'])
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved', input: {} })
      .expect(201);

    expect(await findEntity(WorkflowApprovalRequest, { id: req.id })).toMatchObject({
      status: 'resolved',
      resolvedByUserId: null,
    });
  });

  describe('input validated against the node inputSchema', () => {
    const inputSchema = [
      { name: 'amount', type: 'number', required: true },
      { name: 'note', type: 'text' },
      { name: 'tier', type: 'select', options: ['gold', 'silver'] },
    ];

    it.each([
      ['a required field is missing', {}],
      ['a required field is an empty string', { amount: '' }],
      ['a number field gets a string', { amount: '12' }],
      ['a text field gets a number', { amount: 12, note: 5 }],
      ['a select field gets a value outside its options', { amount: 12, tier: 'bronze' }],
    ])('returns 400 and leaves the request pending when %s', async (_case, input) => {
      const req = await seedPending({ tokenBypass: true }, inputSchema);

      await request(app.getHttpServer())
        .post(`/api/workflow-approvals/${req.token}/resolve`)
        .send({ outcome: 'approved', input })
        .expect(400);

      expect(await findEntity(WorkflowApprovalRequest, { id: req.id })).toMatchObject({ status: 'pending' });
    });

    it('persists only the fields the schema defines', async () => {
      const req = await seedPending({ tokenBypass: true }, inputSchema);

      await request(app.getHttpServer())
        .post(`/api/workflow-approvals/${req.token}/resolve`)
        .send({ outcome: 'approved', input: { amount: 12, tier: 'gold', injected: 'x' } })
        .expect(201);

      const saved = await findEntity(WorkflowApprovalRequest, { id: req.id });
      expect(saved.input).toEqual({ amount: 12, tier: 'gold' });
    });

    it('resolves and persists input that matches the schema', async () => {
      const req = await seedPending({ tokenBypass: true }, inputSchema);

      await request(app.getHttpServer())
        .post(`/api/workflow-approvals/${req.token}/resolve`)
        .send({ outcome: 'approved', input: { amount: 12 } })
        .expect(201);

      expect(await findEntity(WorkflowApprovalRequest, { id: req.id })).toMatchObject({
        status: 'resolved',
        input: { amount: 12 },
      });
    });
  });

  it('leaves an already-cancelled request as it was when a second resolve races the disabled-workflow cancel', async () => {
    const req = await seedPending();
    const cancelledAt = new Date('2026-01-01T00:00:00.000Z');
    await updateEntity(App, workflowAppId, { isMaintenanceOn: false });
    // The first resolve already cancelled it; this one read the row before that committed.
    await updateEntity(WorkflowApprovalRequest, req.id, { status: 'cancelled', resolvedAt: cancelledAt });
    jest
      .spyOn(app.get(WorkflowApprovalRequestRepository, { strict: false }), 'findByToken')
      .mockResolvedValueOnce({ ...req, status: 'pending' } as WorkflowApprovalRequest);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${req.token}/resolve`)
      .send({ outcome: 'approved', input: {} })
      .expect(409);

    expect(await findEntity(WorkflowApprovalRequest, { id: req.id })).toMatchObject({
      status: 'cancelled',
      resolvedAt: cancelledAt,
    });
  });

  it('returns 404 for an unknown token', async () => {
    await request(app.getHttpServer()).get('/api/workflow-approvals/no-such-token').expect(404);
  });
});

describe('workflow-approvals controller — CE edition', () => {
  let ceApp: INestApplication;

  beforeAll(async () => {
    ({ app: ceApp } = await initTestApp({ edition: 'ce', withWorkflows: true }));
  });
  afterAll(async () => {
    await closeTestApp(ceApp);
  }, 60000);

  it.each([
    ['GET', '/api/workflow-approvals/any-token'],
    ['POST', '/api/workflow-approvals/any-token/resolve'],
  ])('returns 501 for the EE-only token route %s %s', async (method, path) => {
    const server = request(ceApp.getHttpServer());
    const response = await (method === 'GET' ? server.get(path) : server.post(path).send({ outcome: 'approved' }));
    expect(response.statusCode).toBe(501);
  });
});
