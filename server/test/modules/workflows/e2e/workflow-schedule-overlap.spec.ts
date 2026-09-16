import { INestApplication } from '@nestjs/common';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

/** @group workflows */
describe('schedule overlap guard', () => {
  let app: INestApplication;
  let service: WorkflowExecutionsService;
  let appVersionId: string;
  let userId: string;
  const scheduleId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    service = app.get(WorkflowExecutionsService);
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-overlap@tooljet.io',
      password: 'password',
      firstName: 'H',
      lastName: 'O',
    });
    userId = user.id;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL overlap wf');
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('reports a non-terminal run for a schedule that has a waiting run', async () => {
    await saveEntity(WorkflowExecution, {
      appVersionId,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: userId,
      logs: [],
      scheduleId,
    });
    expect(await service.hasNonTerminalRunForSchedule(scheduleId)).toBe(true);
  });

  it('reports no non-terminal run when the only run for the schedule is completed', async () => {
    const other = '22222222-2222-2222-2222-222222222222';
    await saveEntity(WorkflowExecution, {
      appVersionId,
      startNodeId: null,
      executed: true,
      status: 'success',
      executingUserId: userId,
      logs: [],
      scheduleId: other,
    });
    expect(await service.hasNonTerminalRunForSchedule(other)).toBe(false);
  });
});
