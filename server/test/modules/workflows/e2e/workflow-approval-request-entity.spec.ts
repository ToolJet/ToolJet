import { INestApplication } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  getDefaultDataSource,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';

/** @group workflows */
describe('WorkflowApprovalRequest entity', () => {
  let app: INestApplication;
  let executionId: string;
  let nodeId: string;
  let organizationId: string;
  let appId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-entity@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Entity',
    });
    const workflowApp = await createWorkflowForUser(app, user, 'HITL entity wf');
    organizationId = user.organizationId;
    appId = workflowApp.id;
    const appVersion = await createWorkflowApplicationVersion(app, workflowApp);
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: appVersion.id,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: user.id,
      logs: [],
    });
    executionId = execution.id;
    const node = await saveEntity(WorkflowExecutionNode, {
      type: 'human',
      executed: false,
      result: '',
      state: {},
      idOnWorkflowDefinition: 'human-1',
      workflowExecutionId: executionId,
      definition: { nodeType: 'human', nodeName: 'approval1' },
    });
    nodeId = node.id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('persists and reads back a pending approval request', async () => {
    const saved = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: executionId,
      executionNodeId: nodeId,
      token: 'tok-entity-1',
      status: 'pending',
      approversSnapshot: { users: [], groups: [], emails: [] },
      expiresAt: null,
    });
    const found = await findEntityOrFail(WorkflowApprovalRequest, { id: saved.id });
    expect(found).toMatchObject({ token: 'tok-entity-1', status: 'pending', workflowExecutionId: executionId });
  });

  it('reads back created_at as the insert instant when the database zone differs from the server zone', async () => {
    // +14:00 differs from any zone a server runs in, so a zone-less column would shift by the offset.
    await getDefaultDataSource().query(`SET LOCAL TimeZone = 'Pacific/Kiritimati'`);
    const before = Date.now();
    const saved = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: executionId,
      executionNodeId: nodeId,
      token: 'tok-entity-tz',
      status: 'pending',
      approversSnapshot: { users: [], groups: [], emails: [] },
      expiresAt: null,
    });

    const found = await findEntityOrFail(WorkflowApprovalRequest, { id: saved.id });

    expect(Math.abs(found.createdAt.getTime() - before)).toBeLessThan(60_000);
    expect(Math.abs(found.updatedAt.getTime() - before)).toBeLessThan(60_000);
  });

  it('rejects a second pending request for the same (execution, node) via the partial unique index', async () => {
    // Both inserts live in THIS test: the per-test SAVEPOINT is rolled back between
    // tests, so a row created in another `it` would not survive to collide here.
    await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: executionId,
      executionNodeId: nodeId,
      token: 'tok-entity-2a',
      status: 'pending',
      approversSnapshot: {},
      expiresAt: null,
    });
    await expect(
      saveEntity(WorkflowApprovalRequest, {
        workflowExecutionId: executionId,
        executionNodeId: nodeId,
        token: 'tok-entity-2b',
        status: 'pending',
        approversSnapshot: {},
        expiresAt: null,
      })
    ).rejects.toBeInstanceOf(QueryFailedError);
  });

  it('persists organization_id and app_id on an approval request', async () => {
    const saved = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: executionId,
      executionNodeId: nodeId,
      token: 'org-stamp-token',
      status: 'pending',
      approversSnapshot: { users: [], groups: [], emails: [], tokenBypass: true },
      organizationId,
      appId,
    });

    const found = await findEntityOrFail(WorkflowApprovalRequest, { id: saved.id });
    expect(found.organizationId).toBe(organizationId);
    expect(found.appId).toBe(appId);
  });
});
