import { INestApplication } from '@nestjs/common';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  getDefaultDataSource,
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
  let environmentId: string;
  // schedule_id on workflow_executions is a FK to workflow_schedules(id); each test
  // seeds a real schedule row and uses its generated id so the insert satisfies the FK.
  let waitingScheduleId: string;
  let completedScheduleId: string;

  const seedSchedule = async (): Promise<string> => {
    const schedule = await saveEntity(WorkflowSchedule, {
      workflowId: appVersionId,
      environmentId,
      active: true,
      type: 'interval',
      timezone: 'UTC',
      details: {},
    });
    return schedule.id;
  };

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
    service = app.get(WorkflowExecutionsService, { strict: false });
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-overlap@tooljet.io',
      password: 'password',
      firstName: 'H',
      lastName: 'O',
    });
    userId = user.id;
    const workflowApp = await createWorkflowForUser(app, user, 'HITL overlap wf');
    appVersionId = (await createWorkflowApplicationVersion(app, workflowApp)).id;
    const devEnv = await getDefaultDataSource()
      .getRepository(AppEnvironment)
      .findOne({ where: { organizationId: workflowApp.organizationId, name: 'development' } });
    environmentId = devEnv.id;
    waitingScheduleId = await seedSchedule();
    completedScheduleId = await seedSchedule();
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
      scheduleId: waitingScheduleId,
    });
    expect(await service.hasNonTerminalRunForSchedule(waitingScheduleId)).toBe(true);
  });

  it('reports no non-terminal run when the only run for the schedule is completed', async () => {
    await saveEntity(WorkflowExecution, {
      appVersionId,
      startNodeId: null,
      executed: true,
      status: 'success',
      executingUserId: userId,
      logs: [],
      scheduleId: completedScheduleId,
    });
    expect(await service.hasNonTerminalRunForSchedule(completedScheduleId)).toBe(false);
  });
});
