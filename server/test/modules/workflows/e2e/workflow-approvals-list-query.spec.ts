import { INestApplication } from '@nestjs/common';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { App } from '@entities/app.entity';
import { WorkflowApprovalRequestRepository } from '@modules/workflows/repositories/workflow-approval-request.repository';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
  getDefaultDataSource,
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
  let devEnvId: string;
  let stagingEnvId: string;

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

    const environmentRepo = getDefaultDataSource().getRepository(AppEnvironment);
    devEnvId = (await environmentRepo.findOne({ where: { organizationId: orgA, name: 'development' } })).id;
    stagingEnvId = (await environmentRepo.findOne({ where: { organizationId: orgA, name: 'staging' } })).id;

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
    environmentId?: string;
  }) {
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: opts.versionId,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: userAId,
      logs: [],
      environmentId: opts.environmentId ?? null,
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
    // TypeORM honours an explicit createdAt on insert.
    return saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: opts.token,
      status: opts.status,
      approversSnapshot: opts.approversSnapshot ?? { users: [], groups: [], emails: [], tokenBypass: true },
      organizationId: opts.organizationId,
      appId: opts.appId,
      environmentId: opts.environmentId ?? null,
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

  it('filters by status', async () => {
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'resolved-1', status: 'resolved' });

    const { rows } = await repository.listForOrganization(orgA, { statuses: ['resolved'] }, 1, 10);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === 'resolved')).toBe(true);
  });

  it('filters by environment', async () => {
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'env-dev',
      status: 'pending',
      environmentId: devEnvId,
    });
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'env-staging',
      status: 'pending',
      environmentId: stagingEnvId,
    });

    const { rows } = await repository.listForOrganization(orgA, { environmentId: devEnvId }, 1, 10);

    expect(rows.map((r) => r.token)).toContain('env-dev');
    expect(rows.map((r) => r.token)).not.toContain('env-staging');
  });

  it('includes every environment when no environment filter is given, even rows carrying none', async () => {
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'env-none',
      status: 'pending',
    });

    const { rows } = await repository.listForOrganization(orgA, {}, 1, 50);

    expect(rows.map((r) => r.token)).toContain('env-none');
  });

  it('maps the environment name onto each row', async () => {
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'env-mapped',
      status: 'pending',
      environmentId: devEnvId,
    });

    const { rows } = await repository.listForOrganization(orgA, { environmentId: devEnvId }, 1, 10);

    expect(rows.find((r) => r.token === 'env-mapped')?.environment?.name).toBe('development');
  });

  it('orders newest first and paginates', async () => {
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
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'mapped-1', status: 'pending' });

    const { rows } = await repository.listForOrganization(orgA, { appId: appAId }, 1, 10);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].app?.name).toBe('List wf A');
    expect(rows[0].node?.definition?.nodeName).toContain('node-');
  });

  it('maps the workflow name from its version row when apps.name is empty, as production creates it', async () => {
    // AppsUtilService.create saves every app — workflows included — with apps.name = NULL; the
    // name lives on the canonical app_versions row. createWorkflowForUser writes apps.name, so
    // blank it here to match what a real create leaves behind.
    const { user } = await setupOrganizationAndUser(app, {
      email: 'approvals-list-versioned-name@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'Versioned',
    });
    const wf = await createWorkflowForUser(app, user, 'Versioned wf');
    const versionId = (await createWorkflowApplicationVersion(app, wf)).id;
    await getDefaultDataSource().getRepository(App).update(wf.id, { name: null });
    await seed({
      versionId,
      organizationId: user.organizationId,
      appId: wf.id,
      token: 'versioned-1',
      status: 'pending',
    });

    const { rows } = await repository.listForOrganization(user.organizationId, {}, 1, 10);

    expect(rows.map((row) => row.app?.name)).toEqual(['Versioned wf']);
  });

  it('reports the total count of every matching row, not just the page size', async () => {
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'total-1', status: 'pending' });
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'total-2', status: 'pending' });
    await seed({ versionId: versionAId, organizationId: orgA, appId: appAId, token: 'total-3', status: 'pending' });

    const { rows, total } = await repository.listForOrganization(orgA, {}, 1, 1);

    expect(rows).toHaveLength(1);
    expect(total).toBe(3);
  });

  it('filters by approver against the approvers snapshot', async () => {
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'approver-match',
      status: 'pending',
      approversSnapshot: { users: ['user-approver-xyz-789'], groups: [], emails: [], tokenBypass: false },
    });
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'approver-miss',
      status: 'pending',
      approversSnapshot: { users: ['someone-unrelated'], groups: [], emails: [], tokenBypass: false },
    });

    const { rows } = await repository.listForOrganization(orgA, { approver: 'approver-xyz-789' }, 1, 10);

    expect(rows.map((r) => r.token)).toEqual(['approver-match']);
  });

  describe('approver filter matches approver identities only', () => {
    const tokens = (rows: { token: string }[]) => rows.map((r) => r.token).filter((t) => t.startsWith('identity-'));

    beforeAll(async () => {
      await seed({
        versionId: versionAId,
        organizationId: orgA,
        appId: appAId,
        token: 'identity-notified',
        status: 'pending',
        approversSnapshot: {
          users: ['identity-user-id'],
          groups: [],
          emails: [],
          notificationEmails: ['approver.one@tooljet.io'],
          tokenBypass: true,
        },
      });
      await seed({
        versionId: versionAId,
        organizationId: orgA,
        appId: appAId,
        token: 'identity-none',
        status: 'pending',
        approversSnapshot: { users: [], groups: [], emails: [], notificationEmails: [], tokenBypass: true },
      });
    });

    it('should find a picked user by email, ignoring case', async () => {
      const { rows } = await repository.listForOrganization(orgA, { approver: 'APPROVER.ONE@' }, 1, 50);

      expect(tokens(rows)).toEqual(['identity-notified']);
    });

    it.each([['users'], ['tokenBypass'], ['true']])('should not match the snapshot key or flag %s', async (term) => {
      const { rows } = await repository.listForOrganization(orgA, { approver: term }, 1, 50);

      expect(tokens(rows)).toEqual([]);
    });

    it.each([['%'], ['_']])('should treat %s literally, not as a wildcard', async (term) => {
      const { rows } = await repository.listForOrganization(orgA, { approver: term }, 1, 50);

      expect(tokens(rows)).toEqual([]);
    });
  });

  it('filters by `from`, including a row exactly on the boundary', async () => {
    const boundary = new Date('2021-02-01T00:00:00Z');
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'from-before',
      status: 'pending',
      createdAt: new Date('2021-01-01T00:00:00Z'),
    });
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'from-on-boundary',
      status: 'pending',
      createdAt: boundary,
    });
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'from-after',
      status: 'pending',
      createdAt: new Date('2021-03-01T00:00:00Z'),
    });

    const { rows } = await repository.listForOrganization(orgA, { from: boundary }, 1, 10);

    // No sort(): the returned order is the assertion.
    expect(rows.map((r) => r.token)).toEqual(['from-after', 'from-on-boundary']);
  });

  it('filters by `to`, including a row exactly on the boundary', async () => {
    const boundary = new Date('2021-02-01T00:00:00Z');
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'to-before',
      status: 'pending',
      createdAt: new Date('2021-01-01T00:00:00Z'),
    });
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'to-on-boundary',
      status: 'pending',
      createdAt: boundary,
    });
    await seed({
      versionId: versionAId,
      organizationId: orgA,
      appId: appAId,
      token: 'to-after',
      status: 'pending',
      createdAt: new Date('2021-03-01T00:00:00Z'),
    });

    const { rows } = await repository.listForOrganization(orgA, { to: boundary }, 1, 10);

    expect(rows.map((r) => r.token)).toEqual(['to-on-boundary', 'to-before']);
  });

  it('paginates deterministically when rows share a created_at, instead of repeating or dropping one', async () => {
    const tied = new Date('2022-06-01T12:00:00.000Z');
    const tiedIds: string[] = [];
    for (const token of ['tie-a', 'tie-b', 'tie-c', 'tie-d']) {
      const request = await seed({
        versionId: versionAId,
        organizationId: orgA,
        appId: appAId,
        token,
        status: 'pending',
        createdAt: tied,
      });
      tiedIds.push(request.id);
    }

    const filters = { from: tied, to: tied };
    const firstPage = await repository.listForOrganization(orgA, filters, 1, 2);
    const secondPage = await repository.listForOrganization(orgA, filters, 2, 2);

    const firstTokens = firstPage.rows.map((r) => r.token);
    const secondTokens = secondPage.rows.map((r) => r.token);

    expect(firstPage.total).toBe(4);
    expect(firstTokens).toHaveLength(2);
    expect(secondTokens).toHaveLength(2);
    // Disjoint pages covering every row: no repeats across the boundary, nothing lost.
    expect(new Set([...firstTokens, ...secondTokens]).size).toBe(4);
    expect([...firstTokens, ...secondTokens].sort()).toEqual(['tie-a', 'tie-b', 'tie-c', 'tie-d']);
    // The order the tie-breaker defines, not just some stable order: id descending.
    expect([...firstPage.rows, ...secondPage.rows].map((r) => r.id)).toEqual([...tiedIds].sort().reverse());
    // And the same query twice returns the same page, rather than a fresh arbitrary slice.
    const firstPageAgain = await repository.listForOrganization(orgA, filters, 1, 2);
    expect(firstPageAgain.rows.map((r) => r.token)).toEqual(firstTokens);
  });
});
