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
      { id: 'req-1', expiresAt: null },
      { timeout: { enabled: false }, reminders: [{ afterSeconds: 3600 }] }
    );
    const names = jobNames(add);
    expect(names).toContain(APPROVAL_REMINDER_JOB);
    expect(names).not.toContain(APPROVAL_DEADLINE_JOB);
  });

  it('schedules both the deadline and the reminders when the timeout is enabled', async () => {
    const { service, add } = makeService();
    await service.scheduleTimers(
      { id: 'req-2', expiresAt: new Date(Date.now() + 60_000) },
      { timeout: { enabled: true }, reminders: [{ afterSeconds: 30 }, { afterSeconds: 45 }] }
    );
    const names = jobNames(add);
    expect(names.filter((n) => n === APPROVAL_DEADLINE_JOB)).toHaveLength(1);
    expect(names.filter((n) => n === APPROVAL_REMINDER_JOB)).toHaveLength(2);
  });

  it('reads reminders from the legacy timeout.reminders location when top-level is absent', async () => {
    const { service, add } = makeService();
    await service.scheduleTimers(
      { id: 'req-3', expiresAt: null },
      { timeout: { enabled: false, reminders: [{ afterSeconds: 120 }] } }
    );
    const reminderJobs = add.mock.calls.filter((c) => c[0] === APPROVAL_REMINDER_JOB);
    expect(reminderJobs).toHaveLength(1);
    // afterSeconds is anchored to creation time, so the delay is afterSeconds * 1000.
    expect(reminderJobs[0][2]).toMatchObject({ jobId: 'reminder:req-3:0', delay: 120_000 });
  });

  it('schedules nothing when the timeout is disabled and there are no reminders', async () => {
    const { service, add } = makeService();
    await service.scheduleTimers({ id: 'req-4', expiresAt: null }, { timeout: { enabled: false } });
    expect(add).not.toHaveBeenCalled();
  });
});
