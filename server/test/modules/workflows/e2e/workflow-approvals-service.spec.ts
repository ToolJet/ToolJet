import { INestApplication } from '@nestjs/common';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';

/** @group workflows */
describe('WorkflowApprovalsService.resolve', () => {
  let app: INestApplication;
  let service: WorkflowApprovalsService;
  let queue: WorkflowExecutionQueueService;
  let appVersionId: string;
  let userId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    service = app.get(WorkflowApprovalsService);
    queue = app.get(WorkflowExecutionQueueService);
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-resolve@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Resolve',
    });
    userId = user.id;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL resolve wf');
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedPending(overrides: Partial<WorkflowApprovalRequest> = {}) {
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
        outcomes: [{ key: 'approved' }, { key: 'rejected' }],
        inputSchema: [],
      },
    });
    const req = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: `tok-${Date.now()}-${Math.random()}`,
      status: 'pending',
      approversSnapshot: { users: [], groups: [], emails: [], tokenBypass: true },
      expiresAt: null,
      ...overrides,
    });
    return { req, node, executionId: execution.id };
  }

  it('resolves a pending request (token-bypass) and enqueues the async resume', async () => {
    const enqueueSpy = jest.spyOn(queue, 'enqueue').mockResolvedValue(undefined);
    const { req, node } = await seedPending();
    const out = await service.resolve(req.token, { outcome: 'approved', input: {} });
    expect(out).toMatchObject({ status: 'resolved' });
    const updated = await findEntityOrFail(WorkflowApprovalRequest, { id: req.id });
    expect(updated).toMatchObject({ status: 'resolved', resolvedOutcome: 'approved' });
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: updated.workflowExecutionId }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        startNodeId: node.id,
        requestId: req.id,
        injectedState: { __humanDecision: { outcome: 'approved', input: {}, resolvedBy: null } },
      })
    );
    enqueueSpy.mockRestore();
  });

  it('rejects an outcome not defined on the node (400)', async () => {
    const { req } = await seedPending();
    await expect(service.resolve(req.token, { outcome: 'nope', input: {} })).rejects.toMatchObject({ status: 400 });
  });

  it('rejects resolving an already-resolved request (409)', async () => {
    const { req } = await seedPending({ status: 'resolved', resolvedOutcome: 'approved' });
    await expect(service.resolve(req.token, { outcome: 'approved', input: {} })).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a past-deadline request (409)', async () => {
    const { req } = await seedPending({ expiresAt: new Date(Date.now() - 1000) });
    await expect(service.resolve(req.token, { outcome: 'approved', input: {} })).rejects.toMatchObject({ status: 409 });
  });

  it('rejects an unknown token (404)', async () => {
    await expect(service.resolve('no-such-token', { outcome: 'approved', input: {} })).rejects.toMatchObject({
      status: 404,
    });
  });
});
