import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  NONEXISTENT_UUID,
} from 'test-helper';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';

/** @group workflows */
describe('WorkflowApprovalsService.resolve', () => {
  let app: INestApplication;
  let service: WorkflowApprovalsService;
  let queue: WorkflowExecutionQueueService;
  let eventEmitter: EventEmitter2;
  let appVersionId: string;
  let userId: string;
  let mainUser: User;
  let approverUserId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    service = app.get(WorkflowApprovalsService);
    queue = app.get(WorkflowExecutionQueueService);
    eventEmitter = app.get(EventEmitter2);
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-resolve@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Resolve',
    });
    userId = user.id;
    mainUser = user;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL resolve wf');
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;

    const { user: approverUser } = await setupOrganizationAndUser(app, {
      email: 'hitl-approver@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Approver',
    });
    approverUserId = approverUser.id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedPending(overrides: Partial<WorkflowApprovalRequest> = {}, overrideAppVersionId?: string) {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: overrideAppVersionId ?? appVersionId,
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

  it('threads the acting user into resolvedByUserId and the resume payload (token-bypass, user present)', async () => {
    const enqueueSpy = jest.spyOn(queue, 'enqueue').mockResolvedValue(undefined);
    const { req } = await seedPending();
    const out = await service.resolve(req.token, { outcome: 'approved', input: {} }, { id: userId });
    expect(out).toMatchObject({ status: 'resolved' });
    const updated = await findEntityOrFail(WorkflowApprovalRequest, { id: req.id });
    expect(updated).toMatchObject({ status: 'resolved', resolvedByUserId: userId });
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        injectedState: { __humanDecision: { outcome: 'approved', input: {}, resolvedBy: userId } },
      })
    );
    enqueueSpy.mockRestore();
  });

  it('rejects an anonymous resolve when tokenBypass is false (403)', async () => {
    const { req } = await seedPending({
      approversSnapshot: { users: [], groups: [], emails: [], tokenBypass: false },
    });
    await expect(service.resolve(req.token, { outcome: 'approved', input: {} })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('rejects a resolve from a user who is not a listed approver (403)', async () => {
    const { req } = await seedPending({
      approversSnapshot: { users: [], groups: [], emails: [], tokenBypass: false },
    });
    await expect(
      service.resolve(
        req.token,
        { outcome: 'approved', input: {} },
        { id: NONEXISTENT_UUID, email: 'nobody@nowhere.test' }
      )
    ).rejects.toMatchObject({ status: 403 });
  });

  it('resolves for an approver named in approversSnapshot.users and records resolvedByUserId', async () => {
    const enqueueSpy = jest.spyOn(queue, 'enqueue').mockResolvedValue(undefined);
    const { req } = await seedPending({
      approversSnapshot: { users: [approverUserId], groups: [], emails: [], tokenBypass: false },
    });
    const out = await service.resolve(req.token, { outcome: 'approved', input: {} }, { id: approverUserId });
    expect(out).toMatchObject({ status: 'resolved' });
    const updated = await findEntityOrFail(WorkflowApprovalRequest, { id: req.id });
    expect(updated).toMatchObject({ status: 'resolved', resolvedByUserId: approverUserId });
    enqueueSpy.mockRestore();
  });

  it('emits a WORKFLOW_APPROVAL_RESOLVED audit log entry on resolve', async () => {
    const enqueueSpy = jest.spyOn(queue, 'enqueue').mockResolvedValue(undefined);
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    const { req } = await seedPending();
    await service.resolve(req.token, { outcome: 'approved', input: {} }, { id: userId });
    expect(emitSpy).toHaveBeenCalledWith(
      'auditLogEntry',
      expect.objectContaining({ actionType: 'WORKFLOW_APPROVAL_RESOLVED', resourceType: 'WORKFLOW' })
    );
    emitSpy.mockRestore();
    enqueueSpy.mockRestore();
  });

  it('cancels the request and fails the execution when the workflow app is disabled while waiting (409)', async () => {
    const disabledApp = await createWorkflowForUser(app, mainUser, 'HITL disabled wf');
    await saveEntity(App, { id: disabledApp.id, isMaintenanceOn: false });
    const disabledVersion = await createWorkflowApplicationVersion(app, disabledApp);
    const { req, executionId } = await seedPending({}, disabledVersion.id);

    await expect(service.resolve(req.token, { outcome: 'approved', input: {} })).rejects.toMatchObject({
      status: 409,
    });

    const updatedReq = await findEntityOrFail(WorkflowApprovalRequest, { id: req.id });
    expect(updatedReq).toMatchObject({ status: 'cancelled' });
    const execution = await findEntityOrFail(WorkflowExecution, { id: executionId });
    expect(execution).toMatchObject({ status: 'failure', executed: true });
  });
});
