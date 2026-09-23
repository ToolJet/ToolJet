import { INestApplication } from '@nestjs/common';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowApprovalRequestRepository } from '@modules/workflows/repositories/workflow-approval-request.repository';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';

/** @group workflows */
describe('approval requests list query', () => {
  let app: INestApplication;
  let repository: WorkflowApprovalRequestRepository;
  let orgA: string;
  let orgB: string;
  let appAId: string;
  let versionAId: string;
  let userAId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    repository = app.get(WorkflowApprovalRequestRepository, { strict: false });

    const { user: userA } = await setupOrganizationAndUser(app, {
      email: 'approvals-list-a@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'A',
    });
    userAId = userA.id;
    orgA = userA.organizationId;
    const wfA = await createWorkflowForUser(app, userA, 'List wf A');
    appAId = wfA.id;
    versionAId = (await createWorkflowApplicationVersion(app, wfA)).id;

    const { user: userB } = await setupOrganizationAndUser(app, {
      email: 'approvals-list-b@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'B',
    });
    orgB = userB.organizationId;
    const wfB = await createWorkflowForUser(app, userB, 'List wf B');
    const versionBId = (await createWorkflowApplicationVersion(app, wfB)).id;
    await seed({ versionId: versionBId, organizationId: orgB, appId: wfB.id, token: 'other-org', status: 'pending' });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seed(opts: {
    versionId: string;
    organizationId: string;
    appId: string;
    token: string;
    status: string;
    createdAt?: Date;
    approversSnapshot?: Record<string, unknown>;
  }) {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: opts.versionId,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: userAId,
      logs: [],
    });
    const node = await saveEntity(WorkflowExecutionNode, {
      type: 'human',
      executed: false,
      result: '',
      state: {},
      idOnWorkflowDefinition: `human-${opts.token}`,
      workflowExecutionId: execution.id,
      definition: {
        nodeType: 'human',
        nodeName: `node-${opts.token}`,
        description: 'please review',
        outcomes: [{ key: 'approved' }, { key: 'rejected' }],
        inputSchema: [],
      },
    });
    // `created_at` is a @CreateDateColumn, but TypeORM honours an explicit value on insert —
    // set it here rather than trying to UPDATE it afterwards.
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: opts.token,
      status: opts.status,
      approversSnapshot: opts.approversSnapshot ?? { users: [], groups: [], emails: [], tokenBypass: true },
      organizationId: opts.organizationId,
      appId: opts.appId,
      ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
    });
  }

  it('returns only requests belonging to the caller organization', async () => {
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'mine-1', status: 'pending' });

    const { rows, total } = await repository.listForOrganization(orgA, {}, 1, 10);

    expect(total).toBeGreaterThan(0);
    expect(rows.every((r) => r.organizationId === orgA)).toBe(true);
    expect(rows.some((r) => r.token === 'other-org')).toBe(false);
  });

  it('never returns another organization rows even when that organization has more data', async () => {
    const { rows } = await repository.listForOrganization(orgB, {}, 1, 10);
    expect(rows.every((r) => r.organizationId === orgB)).toBe(true);
  });

  it('filters by status', async () => {
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'resolved-1', status: 'resolved' });

    const { rows } = await repository.listForOrganization(orgA, { statuses: ['resolved'] }, 1, 10);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === 'resolved')).toBe(true);
  });

  it('orders newest first and paginates', async () => {
    // Each `it()` runs in its own rolled-back SAVEPOINT (server/AGENTS.md: "Seed data in
    // beforeAll (persists across tests in the suite)") — rows seeded by earlier tests (e.g.
    // 'mine-1', 'resolved-1') are gone by the time this test runs. Seed two rows of our own so
    // there is something to paginate across.
    const older = await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'old-1',
      status: 'pending',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    });
    const newer = await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'new-1',
      status: 'pending',
    });

    const firstPage = await repository.listForOrganization(orgA, {}, 1, 1);
    const secondPage = await repository.listForOrganization(orgA, {}, 2, 1);

    expect(firstPage.rows).toHaveLength(1);
    expect(secondPage.rows).toHaveLength(1);
    expect(firstPage.rows[0].id).toBe(newer.id);
    expect(secondPage.rows[0].id).toBe(older.id);
    expect(new Date(firstPage.rows[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(secondPage.rows[0].createdAt).getTime()
    );
  });

  it('maps the workflow name and node definition onto each row', async () => {
    // Self-contained for the same reason as above — this test seeds nothing in beforeAll, so it
    // must create its own row rather than relying on another test's (rolled-back) data.
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'mapped-1', status: 'pending' });

    const { rows } = await repository.listForOrganization(orgA, { appId: appAId }, 1, 10);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].app?.name).toBe('List wf A');
    expect(rows[0].node?.definition?.nodeName).toContain('node-');
  });
});
