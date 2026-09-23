import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  buildTestSession,
} from 'test-helper';

/** @group workflows */
describe('GET /workflow-approvals', () => {
  let app: INestApplication;
  let adminUser: any;
  let adminOrganization: any;
  let organizationId: string;
  let appId: string;
  let versionId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    const { user, organization } = await setupOrganizationAndUser(app, {
      email: 'approvals-list-ctrl@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'Ctrl',
    });
    adminUser = user;
    adminOrganization = organization;
    organizationId = user.organizationId;
    const wf = await createWorkflowForUser(app, user, 'List ctrl wf');
    appId = wf.id;
    versionId = (await createWorkflowApplicationVersion(app, wf)).id;
    await seedRequest('ctrl-1', organizationId, appId, versionId, adminUser.id);
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedRequest(
    token: string,
    orgId: string,
    forAppId: string,
    forVersionId: string,
    executingUserId: string
  ) {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: forVersionId,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId,
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
        outcomes: [{ key: 'approved' }],
        inputSchema: [],
      },
    });
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token,
      status: 'pending',
      approversSnapshot: { users: [], groups: [], emails: [], tokenBypass: true },
      organizationId: orgId,
      appId: forAppId,
    });
  }

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/workflow-approvals').expect(401);
  });

  it('returns the organization requests with pagination metadata', async () => {
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    const response = await request(app.getHttpServer())
      .get('/api/workflow-approvals?page=1&per_page=10')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(200);

    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.meta).toEqual(expect.objectContaining({ page: 1, perPage: 10 }));
    expect(response.body.requests[0]).toEqual(
      expect.objectContaining({ nodeName: expect.any(String), canResolve: expect.any(Boolean) })
    );
    expect(response.body.requests[0].token).toBeUndefined();
  });

  it('filters by status', async () => {
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    const response = await request(app.getHttpServer())
      .get('/api/workflow-approvals?status=pending')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(200);

    expect(response.body.requests.every((r: any) => r.status === 'pending')).toBe(true);
  });

  it("does not leak another organization's approval requests, and ignores a caller-supplied organizationId", async () => {
    const { user: otherUser, organization: otherOrg } = await setupOrganizationAndUser(app, {
      email: 'approvals-list-other-org@tooljet.io',
      password: 'password',
      firstName: 'Other',
      lastName: 'Org',
    });
    const otherWf = await createWorkflowForUser(app, otherUser, 'Other org wf');
    const otherVersion = await createWorkflowApplicationVersion(app, otherWf);
    await seedRequest('ctrl-other-org', otherOrg.id, otherWf.id, otherVersion.id, otherUser.id);

    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    // organizationId is not a recognized filter; only the caller's own session organization is
    // ever used for scoping. Passing another org's id must not leak its rows.
    const response = await request(app.getHttpServer())
      .get(`/api/workflow-approvals?organizationId=${otherOrg.id}`)
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(200);

    const tokens = response.body.requests.map((r: any) => r.executionId);
    expect(tokens).not.toContain(undefined);
    expect(response.body.requests.every((r: any) => r.workflow.id !== otherWf.id)).toBe(true);

    const otherSession = await buildTestSession(otherUser, otherOrg.id);
    const otherResponse = await request(app.getHttpServer())
      .get('/api/workflow-approvals')
      .set('Cookie', otherSession.tokenCookie)
      .set('tj-workspace-id', otherOrg.id)
      .expect(200);

    expect(otherResponse.body.requests.every((r: any) => r.workflow.id !== appId)).toBe(true);
    expect(otherResponse.body.requests.some((r: any) => r.workflow.id === otherWf.id)).toBe(true);
  });

  it('rejects a caller without the LIST_APPROVAL_REQUESTS ability', async () => {
    const { user: plainUser } = await createUser(app, {
      email: 'approvals-list-no-ability@tooljet.io',
      groups: ['end-user'],
      organization: adminOrganization,
    });
    const { tokenCookie } = await buildTestSession(plainUser, organizationId);

    await request(app.getHttpServer())
      .get('/api/workflow-approvals')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(403);
  });

  it('rejects an out-of-range page instead of letting a negative OFFSET reach Postgres', async () => {
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .get('/api/workflow-approvals?page=0')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(400);
  });

  it('rejects a per_page above the maximum', async () => {
    const { tokenCookie } = await buildTestSession(adminUser, organizationId);

    await request(app.getHttpServer())
      .get('/api/workflow-approvals?per_page=100000')
      .set('Cookie', tokenCookie)
      .set('tj-workspace-id', organizationId)
      .expect(400);
  });
});
