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
describe('WorkflowApprovalsService.expire', () => {
  let app: INestApplication;
  let service: WorkflowApprovalsService;
  let queue: WorkflowExecutionQueueService;
  let appVersionId: string;
  let userId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    service = app.get(WorkflowApprovalsService, { strict: false });
    queue = app.get(WorkflowExecutionQueueService, { strict: false });
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-expire@tooljet.io',
      password: 'password',
      firstName: 'H',
      lastName: 'E',
    });
    userId = user.id;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL expire wf');
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seed(onExpire: 'fail' | 'branch') {
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
        nodeName: 'a1',
        outcomes: [{ key: 'approved' }, { key: 'rejected' }],
        inputSchema: [],
        timeout: { enabled: true, durationSeconds: 60, onExpire, timeoutOutcome: 'rejected' },
      },
    });
    const req = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: `tok-${Date.now()}-${Math.random()}`,
      status: 'pending',
      approversSnapshot: { tokenBypass: true },
      expiresAt: new Date(Date.now() - 1000),
    });
    return { req, node, executionId: execution.id };
  }

  it('branch-on-expire resolves with the timeout outcome and enqueues the resume', async () => {
    const enqueueSpy = jest.spyOn(queue, 'enqueue').mockResolvedValue(undefined);
    const { req } = await seed('branch');
    await service.expire(req.id);
    const updated = await findEntityOrFail(WorkflowApprovalRequest, { id: req.id });
    expect(updated).toMatchObject({ status: 'resolved', resolvedOutcome: 'rejected' });
    expect(enqueueSpy).toHaveBeenCalled();
    enqueueSpy.mockRestore();
  });

  it('fail-on-expire marks the request expired and fails the run', async () => {
    const { req, executionId } = await seed('fail');
    await service.expire(req.id);
    expect((await findEntityOrFail(WorkflowApprovalRequest, { id: req.id })).status).toBe('expired');
    expect((await findEntityOrFail(WorkflowExecution, { id: executionId })).status).toBe('failure');
  });

  it('is a no-op for an already-resolved request', async () => {
    const { req } = await seed('fail');
    await service.expire(req.id); // -> expired
    await service.expire(req.id); // no-op, no throw
    expect((await findEntityOrFail(WorkflowApprovalRequest, { id: req.id })).status).toBe('expired');
  });
});
