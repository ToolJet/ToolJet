import { INestApplication } from '@nestjs/common';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createUser,
  createUserWorkflowPermissions,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';

/** @group workflows */
describe('approvals list service :: canResolve', () => {
  let app: INestApplication;
  let service: WorkflowApprovalsService;
  let organizationId: string;
  let appId: string;
  let versionId: string;
  let adminUser: any;
  let builderUser: any;
  let organization: any;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    service = app.get(WorkflowApprovalsService, { strict: false });

    // setupOrganizationAndUser puts this user in the default `admin` group, so they are a
    // workspace admin — the admin-override path in authorizeResolverForUser.
    const { user, organization: org } = await setupOrganizationAndUser(app, {
      email: 'approvals-canresolve-admin@tooljet.io',
      password: 'password',
      firstName: 'Can',
      lastName: 'Admin',
    });
    adminUser = user;
    organization = org;
    organizationId = user.organizationId;
    const wf = await createWorkflowForUser(app, user, 'CanResolve wf');
    appId = wf.id;
    versionId = (await createWorkflowApplicationVersion(app, wf)).id;

    // A builder in the SAME organization. setupOrganizationAndUser always creates a fresh org
    // and puts its user in the default `admin` group, so it cannot produce a non-admin member —
    // use createUser against the existing organization instead. createUserWorkflowPermissions
    // attaches a CUSTOM_GROUP, which satisfies the LIST_APPROVAL_REQUESTS ability grant without
    // making the user a workspace admin (isWorkspaceAdmin checks the DEFAULT admin group).
    const { user: builder } = await createUser(app, {
      email: 'approvals-canresolve-builder@tooljet.io',
      firstName: 'Can',
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

  // Each `it()` runs inside its own rolled-back SAVEPOINT, so rows seeded by one case are gone
  // by the next — every case seeds the request it asserts on.
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
        description: 'please review',
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

  it('does not mark a row resolvable just because tokenBypass is on', async () => {
    // tokenBypass defaults to true on every request; a page caller presents no token.
    const seeded = await seedRequest('bypass-only', { users: [], groups: [], emails: [], tokenBypass: true });

    const { requests } = await service.list(builderUser, { appId }, 1, 50);
    const row = requests.find((r) => r.id === seeded.id);

    expect(row).toBeDefined();
    expect(row.canResolve).toBe(false);
  });

  it('does not mark another user request resolvable for a builder', async () => {
    // The product rule is "admin resolves anything, builder resolves their own". This builder is
    // not an approver on this request and is not a workspace admin, so every authorization path
    // must deny — including when the listed approver is someone else entirely.
    const seeded = await seedRequest('other-users-request', {
      users: [adminUser.id],
      groups: [],
      emails: ['someone-else@tooljet.io'],
      tokenBypass: true,
    });

    const { requests } = await service.list(builderUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).canResolve).toBe(false);
  });

  it('marks a row resolvable for a builder listed as an approver', async () => {
    const seeded = await seedRequest('listed-builder', {
      users: [builderUser.id],
      groups: [],
      emails: [],
      tokenBypass: true,
    });

    const { requests } = await service.list(builderUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).canResolve).toBe(true);
  });

  it('marks every row resolvable for a workspace admin via the override', async () => {
    const seeded = await seedRequest('admin-override', { users: [], groups: [], emails: [], tokenBypass: false });

    const { requests } = await service.list(adminUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).canResolve).toBe(true);
  });

  it('returns display fields and never leaks the token', async () => {
    const seeded = await seedRequest('shape-check', { users: [], groups: [], emails: [], tokenBypass: true });

    const { requests, meta } = await service.list(adminUser, { appId }, 1, 50);
    const row = requests.find((r) => r.id === seeded.id);

    expect(row.workflow.name).toBe('CanResolve wf');
    expect(row.nodeName).toBe('node-shape-check');
    expect(row.description).toBe('please review');
    expect(row.outcomes).toEqual([{ key: 'approved' }, { key: 'rejected' }]);
    expect((row as any).token).toBeUndefined();
    expect(meta.page).toBe(1);
    expect(typeof meta.total).toBe('number');
  });
});
