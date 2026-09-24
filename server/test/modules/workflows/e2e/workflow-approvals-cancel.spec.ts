import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
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
} from 'test-helper';

/**
 * `POST /workflow-approvals/:id/cancel` is **admin-only** (spec §7: "Admins additionally see
 * Cancel"; decision #3). It is destructive — it cancels the request's timers and fails the whole
 * WorkflowExecution — and until this suite existed it performed no authorization at all: any
 * caller the FeatureAbilityGuard let through (i.e. any builder with one editable workflow, in ANY
 * workspace, since the guard's resource check is workspace-level and app-less) could cancel any
 * request id. The approvals list hands out those ids, so the exploit needed nothing else.
 *
 * Being a *listed approver* is deliberately not enough: an approver resolves, an admin cancels.
 */
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

    // A non-admin member of the SAME workspace. setupOrganizationAndUser always mints a fresh org
    // and puts its user in the default `admin` group, so it cannot produce a non-admin member —
    // createUser against the existing organization can. createUserWorkflowPermissions attaches a
    // CUSTOM_GROUP, which satisfies the HUMAN_IN_THE_LOOP ability grant (so the request reaches
    // the service, which is the whole point) without making the user a workspace admin.
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

  // Each `it()` runs inside its own rolled-back SAVEPOINT, so every case seeds its own row.
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

  it('cancels for an admin who is ALSO a listed approver', async () => {
    // Regression pin. `authorizeResolverForUser` checks the configured-approver paths before the
    // admin overrides, so this caller is credited `via: 'allowlist'`, not `'workspace-admin'`.
    // An admin gate written as `ADMIN_OVERRIDE_CHANNELS.has(auth.via)` would read that as
    // "not an admin" and 403 exactly the admins who were assigned the approval. `via` is an
    // audit label for how someone was authorized, not a role test — see `isApprovalAdmin`.
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
