import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import {
  WorkflowExecutionRepository,
  STATUS_FILTER_TO_PREDICATE,
} from '@modules/workflows/repositories/workflow-execution.repository';
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
describe('workflow executions list query', () => {
  let app: INestApplication;
  let repository: WorkflowExecutionRepository;
  let orgA: string;
  let userAId: string;
  let appAId: string;
  let versionAId: string;
  let orgBExecutionId: string;

  const seedRun = async (opts: {
    executed?: boolean;
    status?: string;
    createdAt?: Date;
    organizationId?: string;
    appId?: string;
    versionId?: string;
  }): Promise<string> => {
    const run = await saveEntity(WorkflowExecution, {
      appVersionId: opts.versionId ?? versionAId,
      startNodeId: null,
      executed: opts.executed ?? true,
      // Omitted status takes the column default, 'success', as a real in-flight insert does.
      ...(opts.status ? { status: opts.status } : {}),
      executingUserId: userAId,
      logs: [],
      organizationId: opts.organizationId ?? orgA,
      appId: opts.appId ?? appAId,
      ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
    });
    return run.id;
  };

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    repository = app.get(WorkflowExecutionRepository, { strict: false });

    const { user: userA } = await setupOrganizationAndUser(app, {
      email: 'executions-list-a@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'A',
    });
    userAId = userA.id;
    orgA = userA.organizationId;
    const wfA = await createWorkflowForUser(app, userA, 'Executions list wf A');
    appAId = wfA.id;
    versionAId = (await createWorkflowApplicationVersion(app, wfA)).id;

    const { user: userB } = await setupOrganizationAndUser(app, {
      email: 'executions-list-b@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'B',
    });
    const wfB = await createWorkflowForUser(app, userB, 'Executions list wf B');
    const versionBId = (await createWorkflowApplicationVersion(app, wfB)).id;
    orgBExecutionId = await seedRun({ organizationId: userB.organizationId, appId: wfB.id, versionId: versionBId });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('maps the workflow name from its version row when apps.name is empty, as production creates it', async () => {
    // AppsUtilService.create saves every app — workflows included — with apps.name = NULL; the
    // name lives on the canonical app_versions row. createWorkflowForUser writes apps.name, so
    // blank it here to match what a real create leaves behind.
    const { user } = await setupOrganizationAndUser(app, {
      email: 'executions-list-versioned-name@tooljet.io',
      password: 'password',
      firstName: 'List',
      lastName: 'Versioned',
    });
    const wf = await createWorkflowForUser(app, user, 'Versioned wf');
    const version = await createWorkflowApplicationVersion(app, wf);
    await getDefaultDataSource().getRepository(App).update(wf.id, { name: null });
    await saveEntity(WorkflowExecution, {
      appVersionId: version.id,
      startNodeId: null,
      executed: true,
      status: 'success',
      executingUserId: user.id,
      logs: [],
      organizationId: user.organizationId,
      appId: wf.id,
    });

    const { rows } = await repository.listForOrganization(user.organizationId, {}, 1, 10);

    expect(rows.map((row) => row.app?.name)).toEqual(['Versioned wf']);
  });

  it("lists only the caller's workspace runs, and counts only those", async () => {
    const ownId = await seedRun({});

    const { rows, total } = await repository.listForOrganization(orgA, {}, 1, 10);

    expect(rows.map((row) => row.id)).toEqual([ownId]);
    expect(rows.map((row) => row.id)).not.toContain(orgBExecutionId);
    expect(total).toBe(1);
  });

  it('pages newest first and reports the full count, not the page size', async () => {
    const oldest = await seedRun({ createdAt: new Date('2025-01-01T00:00:00Z') });
    const middle = await seedRun({ createdAt: new Date('2025-02-01T00:00:00Z') });
    const newest = await seedRun({ createdAt: new Date('2025-03-01T00:00:00Z') });

    const firstPage = await repository.listForOrganization(orgA, {}, 1, 2);
    const secondPage = await repository.listForOrganization(orgA, {}, 2, 2);

    expect(firstPage.rows.map((row) => row.id)).toEqual([newest, middle]);
    expect(secondPage.rows.map((row) => row.id)).toEqual([oldest]);
    expect(firstPage.total).toBe(3);
    expect(secondPage.total).toBe(3);
  });

  it('breaks created_at ties by id descending, so tied runs page in one fixed order', async () => {
    const tied = new Date('2025-06-01T12:00:00.000Z');
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) ids.push(await seedRun({ createdAt: tied }));

    const firstPage = await repository.listForOrganization(orgA, {}, 1, 2);
    const secondPage = await repository.listForOrganization(orgA, {}, 2, 2);

    const expected = [...ids].sort().reverse();
    expect([...firstPage.rows, ...secondPage.rows].map((row) => row.id)).toEqual(expected);
  });

  describe('status filters', () => {
    // One run per stored state; each filter key must select exactly its own runs.
    const seedOnePerState = async () => ({
      inFlight: await seedRun({ executed: false }),
      waiting: await seedRun({ executed: false, status: 'waiting' }),
      waitingForDelay: await seedRun({ executed: false, status: 'waiting_for_delay' }),
      success: await seedRun({ executed: true, status: 'success' }),
      failure: await seedRun({ executed: true, status: 'failure' }),
      terminated: await seedRun({ executed: true, status: 'terminated' }),
    });

    it.each([
      ['running', ['inFlight']],
      ['waiting', ['waiting', 'waitingForDelay']],
      ['success', ['success']],
      ['failed', ['failure']],
      ['terminated', ['terminated']],
    ])('selects only the matching runs for the %s filter', async (status, expectedKeys) => {
      const seeded = await seedOnePerState();

      const { rows, total } = await repository.listForOrganization(orgA, { statuses: [status] }, 1, 10);

      const expected = (expectedKeys as Array<keyof typeof seeded>).map((key) => seeded[key]).sort();
      expect(rows.map((row) => row.id).sort()).toEqual(expected);
      expect(total).toBe(expected.length);
    });

    it('covers every status filter key the repository defines', () => {
      expect(Object.keys(STATUS_FILTER_TO_PREDICATE).sort()).toEqual(
        ['failed', 'running', 'success', 'terminated', 'waiting'].sort()
      );
    });

    it('ORs several status filters together', async () => {
      const seeded = await seedOnePerState();

      const { rows } = await repository.listForOrganization(orgA, { statuses: ['running', 'failed'] }, 1, 10);

      expect(rows.map((row) => row.id).sort()).toEqual([seeded.inFlight, seeded.failure].sort());
    });
  });
});
