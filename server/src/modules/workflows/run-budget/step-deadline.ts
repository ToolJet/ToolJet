/** Why a step's deadline fired: its run's time is up (or its own cap), or the run was terminated. */
export class StepStoppedError extends Error {
  constructor(
    readonly reason: 'timeout' | 'terminated',
    message: string
  ) {
    super(message);
    this.name = 'StepStoppedError';
  }
}

/** The deadline of one step (a query, an agent call, a Python run) of a workflow run. */
export interface StepDeadline {
  /** Fires with a StepStoppedError as its reason. Hand it to whatever the step waits on. */
  readonly signal: AbortSignal;
  /** Time left for the step when it started, in ms. */
  readonly remainingMs: number;
  /** Stops the timer and the termination poll; call when the step ends. */
  dispose(): void;
}

export interface StepDeadlineOptions {
  /** The run's time left (its timeout minus what it has used). */
  runRemainingMs: number;
  /** A shorter cap for every step (WORKFLOW_LIMIT_STEP_TIMEOUT_MS); 0 or less = none (D40). */
  stepTimeoutMs?: number;
  /** Polled while the step runs, so terminating the run stops the step too (D42). */
  isTerminated?: () => Promise<boolean>;
  pollMs?: number;
}

/*
 * A step may run until its run's time is up, or until the step cap if one is set and shorter, and
 * not past a termination (decisions D40, D42). The signal lets the step's own work stop at that
 * point (an HTTP request is cancelled) instead of running on after the run has given up on it.
 */
export function startStepDeadline(options: StepDeadlineOptions): StepDeadline {
  const { runRemainingMs, stepTimeoutMs = 0, isTerminated, pollMs = 1000 } = options;
  const capped = stepTimeoutMs > 0 && stepTimeoutMs < runRemainingMs;
  const remainingMs = Math.max(0, capped ? stepTimeoutMs : runRemainingMs);
  const controller = new AbortController();
  const stop = (error: StepStoppedError) => {
    if (!controller.signal.aborted) controller.abort(error);
    dispose();
  };

  const timer = setTimeout(
    () =>
      stop(
        new StepStoppedError(
          'timeout',
          capped
            ? `Step stopped after ${stepTimeoutMs} ms (WORKFLOW_LIMIT_STEP_TIMEOUT_MS)`
            : "Step stopped: the run's time limit was reached"
        )
      ),
    remainingMs
  );
  timer.unref?.();

  let polling = false;
  const poll = isTerminated
    ? setInterval(() => {
        if (polling) return;
        polling = true;
        isTerminated()
          .then(
            (terminated) =>
              terminated && stop(new StepStoppedError('terminated', 'Step stopped: the run was terminated'))
          )
          .catch(() => undefined) // A failed check is not a termination
          .finally(() => (polling = false));
      }, pollMs)
    : null;
  poll?.unref?.();

  function dispose() {
    clearTimeout(timer);
    if (poll) clearInterval(poll);
  }

  return { signal: controller.signal, remainingMs, dispose };
}
