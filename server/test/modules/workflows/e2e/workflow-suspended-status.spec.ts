import { INestApplication } from '@nestjs/common';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntityOrFail,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

/** @group workflows */
describe('WorkflowExecutionsService.saveSuspendedStatus', () => {
  let app: INestApplication;
  let service: WorkflowExecutionsService;
  let executionId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    service = app.get(WorkflowExecutionsService);
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-suspend@tooljet.io',
      password: 'password',
      firstName: 'Hitl',
      lastName: 'Suspend',
    });
    const workflowApp = await createWorkflowForUser(app, user, 'HITL suspend wf');
    const appVersion = await createWorkflowApplicationVersion(app, workflowApp);
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: appVersion.id,
      startNodeId: null,
      executed: false,
      status: 'triggered',
      executingUserId: user.id,
      logs: [],
    });
    executionId = execution.id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('sets status=waiting and leaves executed=false', async () => {
    const workflowExecution = await findEntityOrFail(WorkflowExecution, { id: executionId });
    await service.saveSuspendedStatus({ workflowExecution, logs: [{ message: 'waiting', status: 'normal' }] });
    const updated = await findEntityOrFail(WorkflowExecution, { id: executionId });
    expect(updated).toMatchObject({ status: 'waiting', executed: false });
    expect(updated.logs).toHaveLength(1);
  });
});
