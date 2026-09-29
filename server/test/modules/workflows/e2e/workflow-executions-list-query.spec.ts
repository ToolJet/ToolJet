import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionRepository } from '@modules/workflows/repositories/workflow-execution.repository';
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

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    repository = app.get(WorkflowExecutionRepository, { strict: false });
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
});
