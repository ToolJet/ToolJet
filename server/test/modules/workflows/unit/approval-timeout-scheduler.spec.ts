import { Queue } from 'bullmq';
import { WorkflowApprovalTimeoutService } from '@ee/workflows/services/workflow-approval-timeout.service';
import { APPROVAL_DEADLINE_JOB, APPROVAL_REMINDER_JOB } from '@modules/workflows/constants';

/** @group workflows */
describe('WorkflowApprovalTimeoutService.scheduleTimers', () => {
  const makeService = () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const service = new WorkflowApprovalTimeoutService({ add } as any);
    return { service, add };
  };

  const jobNames = (add: jest.Mock) => add.mock.calls.map((c) => c[0]);

  it('schedules reminders even when the timeout is disabled (no deadline job)', async () => {
    const { service, add } = makeService();
    await service.scheduleTimers(
      { id: 'req-1', expiresAt: null, createdAt: new Date() },
      { timeout: { enabled: false }, reminders: [{ afterSeconds: 3600 }] }
    );
    const names = jobNames(add);
    expect(names).toContain(APPROVAL_REMINDER_JOB);
    expect(names).not.toContain(APPROVAL_DEADLINE_JOB);
  });

  it('schedules both the deadline and the reminders when the timeout is enabled', async () => {
    const { service, add } = makeService();
    await service.scheduleTimers(
      { id: 'req-2', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() },
      { timeout: { enabled: true }, reminders: [{ afterSeconds: 30 }, { afterSeconds: 45 }] }
    );
    const names = jobNames(add);
    expect(names.filter((n) => n === APPROVAL_DEADLINE_JOB)).toHaveLength(1);
    expect(names.filter((n) => n === APPROVAL_REMINDER_JOB)).toHaveLength(2);
  });

  it('reads reminders from the legacy timeout.reminders location when top-level is absent', async () => {
    const { service, add } = makeService();
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    await service.scheduleTimers(
      { id: 'req-3', expiresAt: null, createdAt: new Date(now) },
      { timeout: { enabled: false, reminders: [{ afterSeconds: 120 }] } }
    );
    const reminderJobs = add.mock.calls.filter((c) => c[0] === APPROVAL_REMINDER_JOB);
    expect(reminderJobs).toHaveLength(1);
    // afterSeconds is anchored to creation time, so the delay is afterSeconds * 1000.
    expect(reminderJobs[0][2]).toMatchObject({ jobId: 'reminder-req-3-0', delay: 120_000 });
    jest.restoreAllMocks();
  });

  it('schedules nothing when the timeout is disabled and there are no reminders', async () => {
    const { service, add } = makeService();
    await service.scheduleTimers(
      { id: 'req-4', expiresAt: null, createdAt: new Date() },
      { timeout: { enabled: false } }
    );
    expect(add).not.toHaveBeenCalled();
  });
});

/** @group workflows */
describe('WorkflowApprovalTimeoutService.scheduleTimers | real BullMQ queue', () => {
  // The mocked `add` above accepts any job id. BullMQ itself rejects custom ids containing `:`
  // ("Custom Id cannot contain :"), so scheduling must go through a real queue once.
  let queue: Queue;

  beforeAll(() => {
    queue = new Queue(`approval-timeout-spec-${process.pid}-${Date.now()}`, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
        ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
        ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
      },
    });
  });

  afterAll(async () => {
    await queue.obliterate({ force: true });
    await queue.close();
  });

  it('should schedule the deadline and reminders with a timeout enabled, then cancel them', async () => {
    const service = new WorkflowApprovalTimeoutService(queue);
    const definition = { timeout: { enabled: true }, reminders: [{ afterSeconds: 30 }] };
    await service.scheduleTimers(
      { id: 'req-real', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() },
      definition
    );

    const scheduled = await queue.getJobs(['delayed']);
    expect(scheduled.map((j) => ({ name: j.name, id: j.id }))).toEqual(
      expect.arrayContaining([
        { name: APPROVAL_DEADLINE_JOB, id: 'deadline-req-real' },
        { name: APPROVAL_REMINDER_JOB, id: 'reminder-req-real-0' },
      ])
    );

    await service.cancelTimers('req-real', definition);
    expect(await queue.getJobs(['delayed', 'waiting'])).toHaveLength(0);
  });
});
