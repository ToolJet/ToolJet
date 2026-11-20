import { startStepDeadline, StepStoppedError } from '@modules/workflows/run-budget/step-deadline';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A workflow step's deadline: the run's remaining time, a shorter step cap if set, and termination.
 *
 * @group workflows
 */
describe('startStepDeadline', () => {
  it("should fire when the run's time is up, saying so", async () => {
    const deadline = startStepDeadline({ runRemainingMs: 30 });

    await sleep(80);

    expect(deadline.signal.aborted).toBe(true);
    expect(deadline.signal.reason).toBeInstanceOf(StepStoppedError);
    expect(deadline.signal.reason).toMatchObject({
      reason: 'timeout',
      message: "Step stopped: the run's time limit was reached",
    });
  });

  it('should fire at the step cap when that is shorter, naming its env var', async () => {
    const deadline = startStepDeadline({ runRemainingMs: 60_000, stepTimeoutMs: 30 });

    await sleep(80);

    expect(deadline.remainingMs).toBe(30);
    expect(deadline.signal.reason).toMatchObject({
      message: 'Step stopped after 30 ms (WORKFLOW_LIMIT_STEP_TIMEOUT_MS)',
    });
  });

  it('should ignore a step cap of 0 or longer than the run has left', () => {
    expect(startStepDeadline({ runRemainingMs: 500, stepTimeoutMs: 0 }).remainingMs).toBe(500);
    expect(startStepDeadline({ runRemainingMs: 500, stepTimeoutMs: 9000 }).remainingMs).toBe(500);
  });

  it('should fire at once when the run has no time left', async () => {
    const deadline = startStepDeadline({ runRemainingMs: -10 });

    await sleep(20);

    expect(deadline.signal.aborted).toBe(true);
  });

  it('should fire when the run is terminated during the step', async () => {
    let terminated = false;
    const deadline = startStepDeadline({ runRemainingMs: 60_000, isTerminated: async () => terminated, pollMs: 10 });

    await sleep(40);
    expect(deadline.signal.aborted).toBe(false);
    terminated = true;
    await sleep(40);

    expect(deadline.signal.reason).toMatchObject({
      reason: 'terminated',
      message: 'Step stopped: the run was terminated',
    });
  });

  it('should stop firing once disposed', async () => {
    const isTerminated = jest.fn().mockResolvedValue(false);
    const deadline = startStepDeadline({ runRemainingMs: 30, isTerminated, pollMs: 10 });

    deadline.dispose();
    await sleep(80);

    expect(deadline.signal.aborted).toBe(false);
    expect(isTerminated).not.toHaveBeenCalled();
  });
});
