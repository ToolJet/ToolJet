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

/** @group workflows */
describe('POST /workflow-approvals/by-id/:id/resolve', () => {
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
      email: 'resolve-by-id-admin@tooljet.io',
      password: 'password',
      firstName: 'R',
      lastName: 'Admin',
    });
    adminUser = user;
    organizationId = user.organizationId;
    const wf = await createWorkflowForUser(app, user, 'Resolve by id wf');
    appId = wf.id;
    versionId = (await createWorkflowApplicationVersion(app, wf)).id;

    // Non-admin member of the SAME organization (see the note in the list-service spec).
    const { user: builder } = await createUser(app, {
      email: 'resolve-by-id-builder@tooljet.io',
      firstName: 'R',
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
        description: 'review me',
        outcomes: [{ key: 'approved' }, { key: 'rejected' }],
        inputSchema: [],
      },
    });
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token,
      status: 'pending',
      approversSnapshot,
      organizationId,
      appId,
    });
  }

  it('rejects a builder who is not a listed approver, even though tokenBypass is on', async () => {
    const seeded = await seedRequest('rbi-unlisted', { users: [], groups: [], emails: [], tokenBypass: true });
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(403);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: seeded.id });
    expect(after.status).toBe('pending');
  });

  it('resolves for a builder who is a listed approver', async () => {
    const seeded = await seedRequest('rbi-listed', {
      users: [builderUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(201);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: seeded.id });
    expect(after.status).toBe('resolved');
    expect(after.resolvedOutcome).toBe('approved');
    expect(after.resolvedByUserId).toBe(builderUser.id);
  });

  it('rejects an unknown outcome', async () => {
    const seeded = await seedRequest('rbi-bad-outcome', {
      users: [builderUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'not-an-outcome' })
      .expect(400);
  });

  it('rejects a non-UUID id with 400 instead of a raw query error', async () => {
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post('/api/workflow-approvals/by-id/not-a-uuid/resolve')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(400);
  });

  it('resolves for a workspace admin even when not a listed approver', async () => {
    const seeded = await seedRequest('rbi-admin-override', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(201);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: seeded.id });
    expect(after.status).toBe('resolved');
  });

  it('requires authentication', async () => {
    const seeded = await seedRequest('rbi-unauth', { users: [], groups: [], emails: [], tokenBypass: true });

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .send({ outcome: 'approved' })
      .expect(401);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: seeded.id });
    expect(after.status).toBe('pending');
  });

  it("rejects a caller from another workspace, even if listed by id in this workspace's snapshot", async () => {
    // The other-org user is created FIRST so their id can go into the snapshot. Seeding an empty
    // `users` list here would make the case pass on the allowlist miss alone and never exercise
    // its own title: `approversSnapshot` is free text written by whoever configured the node, so
    // a stranger's id (or email) landing in a workspace's snapshot is trivially arrangeable, and
    // `authorizeResolverForUser` would happily authorize them against the REQUEST's org. The org
    // that must gate this is the CALLER's session org.
    const { user: otherUser } = await setupOrganizationAndUser(app, {
      email: 'resolve-by-id-other-org@tooljet.io',
      password: 'password',
      firstName: 'Other',
      lastName: 'Org',
    });

    const seeded = await seedRequest('rbi-cross-org', {
      users: [otherUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });

    const { tokenCookie } = await buildTestSession(otherUser, otherUser.organizationId);

    // 404, not 403: a caller outside the workspace must not learn that this id exists.
    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', otherUser.organizationId)
      .send({ outcome: 'approved' })
      .expect(404);

    const after = await findEntityOrFail(WorkflowApprovalRequest, { id: seeded.id });
    expect(after.status).toBe('pending');
  });

  it('rejects resolving an already-resolved request', async () => {
    const seeded = await seedRequest('rbi-already-resolved', {
      users: [builderUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie } = await buildTestSession(builderUser, organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(409);
  });

  it('pins authorization ahead of the state check: an unauthorized cross-workspace caller gets 404, not 409, for an already-resolved id', async () => {
    const seeded = await seedRequest('rbi-order-leak-check', {
      users: [builderUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });
    const { tokenCookie: builderCookie } = await buildTestSession(builderUser, organizationId);

    // Resolve it first, as the legitimate approver, so the row is no longer pending.
    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', builderCookie)
      .set('tj-workspace-id', organizationId)
      .send({ outcome: 'approved' })
      .expect(201);

    // A caller from a different workspace hits the same id. If the pending/expired check ran
    // before the org scope + authorization checks, this would 409 ("not pending") -- disclosing
    // that the id exists and is already resolved to a caller never authorized to act on it. The
    // org scope check runs first, so this stays 404 regardless of the request's status.
    const { user: otherUser } = await setupOrganizationAndUser(app, {
      email: 'resolve-by-id-order-check@tooljet.io',
      password: 'password',
      firstName: 'Order',
      lastName: 'Check',
    });
    const { tokenCookie: otherCookie } = await buildTestSession(otherUser, otherUser.organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', otherCookie)
      .set('tj-workspace-id', otherUser.organizationId)
      .send({ outcome: 'approved' })
      .expect(404);
  });
});
