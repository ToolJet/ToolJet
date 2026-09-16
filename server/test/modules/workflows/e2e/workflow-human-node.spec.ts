import { INestApplication } from '@nestjs/common';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowExecutionEdge } from '@entities/workflow_execution_edge.entity';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowSuspendedSignal } from '@modules/workflows/types';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

/** @group workflows */
describe('human node — flat suspend/resume', () => {
  let app: INestApplication;
  let service: WorkflowExecutionsService;
  let appVersionId: string;
  let userId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    service = app.get(WorkflowExecutionsService);
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-node@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Node',
    });
    userId = user.id;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL node wf');
    const appVersion = await createWorkflowApplicationVersion(app, workflowApp);
    appVersionId = appVersion.id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedRun() {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId,
      startNodeId: null,
      executed: false,
      status: 'triggered',
      executingUserId: userId,
      logs: [],
    });
    const mk = (type: string, idOnDef: string, definition: any) =>
      saveEntity(WorkflowExecutionNode, {
        type,
        executed: false,
        result: '',
        state: {},
        idOnWorkflowDefinition: idOnDef,
        workflowExecutionId: execution.id,
        definition,
      });
    const start = await mk('input', 'start', { nodeType: 'start' });
    const human = await mk('human', 'human1', {
      nodeType: 'human',
      nodeName: 'approval1',
      approvers: { users: [userId], groups: [], dynamic: '', tokenBypass: true },
      outcomes: [
        { key: 'approved', label: 'Approve' },
        { key: 'rejected', label: 'Reject' },
      ],
      inputSchema: [],
      timeout: { enabled: false },
      notification: { url: 'https://example.test/hook' },
    });
    const okNode = await mk('output', 'okNode', { nodeType: 'response', nodeName: 'okNode' });
    const noNode = await mk('output', 'noNode', { nodeType: 'response', nodeName: 'noNode' });
    await saveEntity(WorkflowExecution, { id: execution.id, startNodeId: start.id });
    const edge = (src: string, tgt: string, handle: string, idOnDef: string) =>
      saveEntity(WorkflowExecutionEdge, {
        idOnWorkflowDefinition: idOnDef,
        workflowExecutionId: execution.id,
        sourceWorkflowExecutionNodeId: src,
        targetWorkflowExecutionNodeId: tgt,
        sourceHandle: handle,
        skipped: false,
      });
    await edge(start.id, human.id, 'output', 'e1');
    await edge(human.id, okNode.id, 'approved', 'e2');
    await edge(human.id, noNode.id, 'rejected', 'e3');
    return { executionId: execution.id, humanId: human.id, okId: okNode.id, noId: noNode.id };
  }

  it('suspends at the human node: run goes waiting and a pending request is created', async () => {
    const { executionId } = await seedRun();
    const execution = await findEntityOrFail(WorkflowExecution, { id: executionId });
    await expect(service.execute(execution, { throwOnError: false })).rejects.toBeInstanceOf(WorkflowSuspendedSignal);
    const updated = await findEntityOrFail(WorkflowExecution, { id: executionId });
    expect(updated).toMatchObject({ status: 'waiting', executed: false });
    const req = await findEntityOrFail(WorkflowApprovalRequest, {
      workflowExecutionId: executionId,
      status: 'pending',
    });
    expect(req.token).toBeTruthy();
    expect(req.approversSnapshot).toMatchObject({ users: [userId], tokenBypass: true });
  });

  it('resumes down the chosen outcome branch and completes', async () => {
    const { executionId, humanId, okId, noId } = await seedRun();
    const first = await findEntityOrFail(WorkflowExecution, { id: executionId });
    await expect(service.execute(first, { throwOnError: false })).rejects.toBeInstanceOf(WorkflowSuspendedSignal);

    const reloaded = await findEntityOrFail(WorkflowExecution, { id: executionId });
    await service.execute(reloaded, {
      startNodeId: humanId,
      injectedState: { __humanDecision: { outcome: 'approved', input: {} } },
      throwOnError: false,
    });

    const humanNode = await findEntityOrFail(WorkflowExecutionNode, { id: humanId });
    expect(humanNode.executed).toBe(true);
    expect(JSON.parse(humanNode.result).data.outcome).toBe('approved');

    const okNode = await findEntityOrFail(WorkflowExecutionNode, { id: okId });
    const noNode = await findEntityOrFail(WorkflowExecutionNode, { id: noId });
    expect(okNode.executed).toBe(true); // approved branch ran
    expect(noNode.executed).toBe(false); // rejected branch skipped

    const done = await findEntityOrFail(WorkflowExecution, { id: executionId });
    expect(done).toMatchObject({ executed: true, status: 'success' });
  });
});
