import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowApprovalRequestRepository } from '@modules/workflows/repositories/workflow-approval-request.repository';
import { WorkflowExecutionQueueService } from '@ee/workflows/services/workflow-execution-queue.service';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  setupOrganizationAndUser,
  createUser,
  createUserWorkflowPermissions,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  buildTestSession,
  updateEntity,
} from 'test-helper';

/** Admin-only: a listed approver resolves, an admin cancels. */
/** @group workflows */
describe('POST /workflow-approvals/:id/cancel', () => {
  let app: INestApplication;
  let adminUser: any;
  let builderUser: any;
  let organizationId: string;
  let appId: string;
  let versionId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    jest.spyOn(app.get(WorkflowExecutionQueueService, { strict: false }), 'enqueue').mockResolvedValue(undefined);

    const { user, organization } = await setupOrganizationAndUser(app, {
      email: 'approvals-cancel-admin@tooljet.io',
      password: 'password',
      firstName: 'Cancel',
      lastName: 'Admin',
    });
    adminUser = user;
    organizationId = user.organizationId;
    const wf = await createWorkflowForUser(app, user, 'Cancel wf');
    appId = wf.id;
    versionId = (await createWorkflowApplicationVersion(app, wf)).id;

    // setupOrganizationAndUser always makes an admin; createUser gives a non-admin member.
    const { user: builder } = await createUser(app, {
      email: 'approvals-cancel-builder@tooljet.io',
      firstName: 'Cancel',
      lastName: 'Builder',
      groups: ['end-user'],
      organization,
    });
    builderUser = builder;
    await createUserWorkflowPermissions(app, builder, organizationId, { isAllEditable: true });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedRequest(token: string, approversSnapshot: Record<string, unknown>) {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: versionId,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: adminUser.id,
      logs: [],
    });
    const node = await saveEntity(WorkflowExecutionNode, {
      type: 'human',
      executed: false,
      result: '',
      state: {},
      idOnWorkflowDefinition: `human-${token}`,
      workflowExecutionId: execution.id,
      definition: {
        nodeType: 'human',
        nodeName: `node-${token}`,
        description: 'cancel me',
        outcomes: [{ key: 'approved' }, { key: 'rejected' }],
        inputSchema: [],
      },
    });
    const approval = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token,
      status: 'pending',
      approversSnapshot,
      organizationId,
      appId,
    });
    return { approval, execution };
  }

  it('rejects a builder who is neither a listed approver nor an admin, and leaves the row pending', async () => {
    const { approval, execution } = await seedRequest('cancel-unlisted', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(403);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id });
    expect(after.status).toBe('pending');
    // The destructive half of cancel must not have fired either.
    const executionAfter = await findEntityOrFail(WorkflowExecution, { id: execution.id });
    expect(executionAfter.status).toBe('waiting');
    expect(executionAfter.executed).toBe(false);
  });

  it('rejects a listed approver who is not an admin — cancel is admin-only, resolve is the approver path', async () => {
    const { approval } = await seedRequest('cancel-listed-approver', {
      users: [builderUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(403);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id });
    expect(after.status).toBe('pending');
  });

  it('cancels for a workspace admin', async () => {
    const { approval, execution } = await seedRequest('cancel-admin', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(201);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id });
    expect(after.status).toBe('cancelled');
    expect(after.resolvedByUserId).toBe(adminUser.id);
    const executionAfter = await findEntityOrFail(WorkflowExecution, { id: execution.id });
    expect(executionAfter.status).toBe('failure');
    expect(executionAfter.executed).toBe(true);
  });

  it('records the cancel in the Workflows audit log with the acting admin', async () => {
    const { approval, execution } = await seedRequest('cancel-audit', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const emitSpy = jest.spyOn(app.get(EventEmitter2), 'emit');
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(201);

    expect(emitSpy).toHaveBeenCalledWith(
      'auditLogEntry',
      expect.objectContaining({
        userId: adminUser.id,
        organizationId,
        resourceId: execution.id,
        resourceName: 'Cancel wf',
        resourceType: 'workflows',
        actionType: 'WORKFLOW_APPROVAL_CANCELLED',
        metadata: { requestId: approval.id, nodeName: 'node-cancel-audit' },
      })
    );
    emitSpy.mockRestore();
  });

  it('cancels for an admin who is ALSO a listed approver', async () => {
    // Admin who is also listed is credited 'allowlist'; cancel must still pass.
    const { approval } = await seedRequest('cancel-admin-also-approver', {
      users: [adminUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(201);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id });
    expect(after.status).toBe('cancelled');
  });

  it('returns 404 for a caller in another workspace — the id must not be confirmed to exist', async () => {
    const { approval } = await seedRequest('cancel-cross-org', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });

    const { user: otherUser } = await setupOrganizationAndUser(app, {
      email: 'approvals-cancel-other-org@tooljet.io',
      password: 'password',
      firstName: 'Other',
      lastName: 'Org',
    });
    const { tokenCookie } = await buildTestSession(otherUser, otherUser.organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', otherUser.organizationId)
      .expect(404);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id });
    expect(after.status).toBe('pending');
  });

  it('returns 409 and leaves the resolved request and its run alone when a resolve lands between read and write', async () => {
    const { approval, execution } = await seedRequest('cancel-race', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    // A resolve commits after cancel read the row as pending.
    await updateEntity(WorkflowApprovalRequest, approval.id, { status: 'resolved', resolvedOutcome: 'approved' });
    jest
      .spyOn(app.get(WorkflowApprovalRequestRepository, { strict: false }), 'findOne')
      .mockResolvedValueOnce({ ...approval, status: 'pending' } as WorkflowApprovalRequest);
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(409);

    expect(await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id })).toMatchObject({
      status: 'resolved',
      resolvedOutcome: 'approved',
    });
    expect(await findEntityOrFail(WorkflowExecution, { id: execution.id })).toMatchObject({
      status: 'waiting',
      executed: false,
    });
  });

  it('rejects a non-UUID id with 400 instead of a raw query error', async () => {
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post('/api/workflow-approvals/not-a-uuid/cancel')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(400);
  });

  it('requires authentication', async () => {
    const { approval } = await seedRequest('cancel-unauth', { users: [], groups: [], emails: [], tokenBypass: true });

    await request(app.getHttpServer()).post(`/api/workflow-approvals/${approval.id}/cancel`).expect(401);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: approval.id });
    expect(after.status).toBe('pending');
  });

  it('pins authorization ahead of the state check: an unauthorized caller gets 403, not 409, for an already-cancelled id', async () => {
    const { approval } = await seedRequest('cancel-order-check', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie: adminCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', adminCookie)
      .set('tj-workspace-id', organizationId)
      .expect(201);

    // The row is no longer pending. A caller who was never authorized must still get 403: a 409
    // here would disclose the row's resolution state to someone with no right to act on it.
    const { tokenCookie: builderCookie } = await buildTestSession(builderUser, organizationId);
    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/${approval.id}/cancel`)
      .set('Cookie', builderCookie)
      .set('tj-workspace-id', organizationId)
      .expect(403);
  });
});
