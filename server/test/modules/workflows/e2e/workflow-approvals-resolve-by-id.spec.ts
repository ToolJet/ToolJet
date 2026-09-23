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
    const seeded = await seedRequest('rbi-cross-org', {
      users: [],
      groups: [],
      emails: [],
      tokenBypass: true,
    });

    const { user: otherUser } = await setupOrganizationAndUser(app, {
      email: 'resolve-by-id-other-org@tooljet.io',
      password: 'password',
      firstName: 'Other',
      lastName: 'Org',
    });
    const { tokenCookie } = await buildTestSession(otherUser, otherUser.organizationId);

    await request(app.getHttpServer())
      .post(`/api/workflow-approvals/by-id/${seeded.id}/resolve`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', otherUser.organizationId)
      .send({ outcome: 'approved' })
      .expect(403);

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
});
