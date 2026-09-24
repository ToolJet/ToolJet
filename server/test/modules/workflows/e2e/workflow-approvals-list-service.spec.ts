import { INestApplication } from '@nestjs/common';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { User } from '@entities/user.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createUser,
  createUserWorkflowPermissions,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  NONEXISTENT_UUID,
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
  let groupPermissionsRepository: GroupPermissionsRepository;
  /** The CUSTOM_GROUP createUserWorkflowPermissions attaches to the builder. */
  let builderGroupId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    service = app.get(WorkflowApprovalsService, { strict: false });
    groupPermissionsRepository = app.get(GroupPermissionsRepository, { strict: false });

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
    const builderGroups = await groupPermissionsRepository.getAllUserGroups(builder.id, organizationId);
    builderGroupId = builderGroups[0].id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  // Each `it()` runs inside its own rolled-back SAVEPOINT, so rows seeded by one case are gone
  // by the next — every case seeds the request it asserts on.
  async function seedRequest(token: string, approversSnapshot: Record<string, unknown>, status = 'pending') {
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
      status,
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

  it('marks a row resolvable for a builder listed by email', async () => {
    const seeded = await seedRequest('listed-email', {
      users: [],
      groups: [],
      emails: [builderUser.email],
      tokenBypass: false,
    });

    const { requests } = await service.list(builderUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).canResolve).toBe(true);
  });

  it('marks a row resolvable for a builder in a custom group listed as an approver', async () => {
    const seeded = await seedRequest('listed-group', {
      users: [],
      groups: [builderGroupId],
      emails: [],
      tokenBypass: false,
    });

    const { requests } = await service.list(builderUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).canResolve).toBe(true);
  });

  it('does not mark a row resolvable for a builder in a different group than the one listed', async () => {
    // The builder IS in a custom group, just not this one — the group branch has to compare
    // membership, not merely observe that the caller has groups at all.
    const seeded = await seedRequest('other-group', {
      users: [],
      groups: [NONEXISTENT_UUID],
      emails: [],
      tokenBypass: false,
    });

    const { requests } = await service.list(builderUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).canResolve).toBe(false);
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

  it('never marks an already-resolved row resolvable, even for a workspace admin', async () => {
    // canResolve means "can act right now", not "would be authorized if it were open". The admin
    // override authorizes this caller, so only the status half can produce false here.
    const seeded = await seedRequest(
      'already-resolved',
      { users: [], groups: [], emails: [], tokenBypass: false },
      'resolved'
    );

    const { requests } = await service.list(adminUser, { appId }, 1, 50);
    const row = requests.find((r) => r.id === seeded.id);

    expect(row.status).toBe('resolved'); // status still on the row, for rendering closed states
    expect(row.canResolve).toBe(false);
  });

  it('projects only the identity fields of the approvers snapshot, never tokenBypass', async () => {
    const seeded = await seedRequest('snapshot-projection', {
      users: [adminUser.id],
      groups: [builderGroupId],
      emails: ['someone@tooljet.io'],
      tokenBypass: true,
    });

    const { requests } = await service.list(adminUser, { appId }, 1, 50);
    const snapshot = requests.find((r) => r.id === seeded.id).approversSnapshot;

    expect(snapshot).toEqual({
      users: [{ id: adminUser.id, kind: 'user', label: 'Can Admin' }],
      groups: [{ id: builderGroupId, kind: 'group', label: expect.any(String) }],
      emails: [{ id: 'someone@tooljet.io', kind: 'email', label: 'someone@tooljet.io' }],
    });
    expect('tokenBypass' in snapshot).toBe(false);
  });

  it('labels an approver with no name by their email, and an unknown id by the id itself', async () => {
    // A user row can legitimately carry empty name fields, and an id in the snapshot can outlive
    // the user it pointed at (removed from the workspace). Neither may render blank.
    const { user: namelessUser } = await createUser(app, {
      firstName: 'Temp',
      lastName: 'Name',
      email: 'nameless-approver@tooljet.io',
      groups: ['end-user'],
      organization,
    });
    // createUser insists on names; clear them on the row so this exercises the real fallback.
    await saveEntity(User, { id: namelessUser.id, firstName: null, lastName: null });

    const seeded = await seedRequest('approver-labels', {
      users: [namelessUser.id, NONEXISTENT_UUID],
      groups: [],
      emails: [],
      tokenBypass: true,
    });

    const { requests } = await service.list(adminUser, { appId }, 1, 50);
    const snapshot = requests.find((r) => r.id === seeded.id).approversSnapshot;

    expect(snapshot.users).toEqual([
      { id: namelessUser.id, kind: 'user', label: 'nameless-approver@tooljet.io' },
      { id: NONEXISTENT_UUID, kind: 'user', label: NONEXISTENT_UUID },
    ]);
  });

  it('labels resolvedBy with the resolver display name', async () => {
    const seeded = await seedRequest(
      'resolved-by-label',
      { users: [], groups: [], emails: [], tokenBypass: true },
      'resolved'
    );
    await saveEntity(WorkflowApprovalRequest, { id: seeded.id, resolvedByUserId: adminUser.id });

    const { requests } = await service.list(adminUser, { appId }, 1, 50);
    const row = requests.find((r) => r.id === seeded.id);

    expect(row.resolvedBy).toEqual({ id: adminUser.id, kind: 'user', label: 'Can Admin' });
  });

  it('leaves resolvedBy null for a system resolution', async () => {
    // The timeout branch auto-resolves with resolvedBy = null. That must stay null rather than
    // becoming a party with an empty label, so the page can say "by the system".
    const seeded = await seedRequest(
      'system-resolved',
      { users: [], groups: [], emails: [], tokenBypass: true },
      'resolved'
    );

    const { requests } = await service.list(adminUser, { appId }, 1, 50);
    expect(requests.find((r) => r.id === seeded.id).resolvedBy).toBeNull();
  });

  it('resolves approver identities once per page, not once per row', async () => {
    // Same hazard the caller-identity hoist addressed: a per-row lookup would be an N+1 against
    // the users table. Three rows naming the same approver must cost one lookup.
    await seedRequest('label-cost-1', { users: [adminUser.id], groups: [], emails: [], tokenBypass: true });
    await seedRequest('label-cost-2', { users: [adminUser.id], groups: [], emails: [], tokenBypass: true });
    await seedRequest('label-cost-3', { users: [adminUser.id], groups: [], emails: [], tokenBypass: true });

    const spy = jest.spyOn(service as never as { lookupParties: (...a: unknown[]) => unknown }, 'lookupParties');
    try {
      await service.list(adminUser, { appId }, 1, 50);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('resolves the caller identity once per page, not once per row', async () => {
    // isWorkspaceAdmin runs through dbTransactionWrap with no manager, i.e. a fresh pooled
    // connection and a full transaction per call. Seed three rows on which this caller is not a
    // listed approver, so both lookups are reached, and pin that each fires exactly once.
    await seedRequest('cost-1', { users: [], groups: [NONEXISTENT_UUID], emails: [], tokenBypass: true });
    await seedRequest('cost-2', { users: [], groups: [NONEXISTENT_UUID], emails: [], tokenBypass: true });
    await seedRequest('cost-3', { users: [], groups: [NONEXISTENT_UUID], emails: [], tokenBypass: true });

    const groupsSpy = jest.spyOn(groupPermissionsRepository, 'getAllUserGroups');
    const adminSpy = jest.spyOn(
      service as unknown as { isWorkspaceAdmin: (userId: string, organizationId: string) => Promise<boolean> },
      'isWorkspaceAdmin'
    );

    try {
      const { requests } = await service.list(builderUser, { appId }, 1, 50);

      expect(requests.length).toBeGreaterThanOrEqual(3);
      expect(requests.every((r) => r.canResolve === false)).toBe(true);
      expect(groupsSpy).toHaveBeenCalledTimes(1);
      expect(adminSpy).toHaveBeenCalledTimes(1);
    } finally {
      groupsSpy.mockRestore();
      adminSpy.mockRestore();
    }
  });
});
