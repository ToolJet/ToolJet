import { QueryError } from '@tooljet/plugins';

export interface IAbortControllerHandler {
  readonly timeoutMs: number;
  readonly canAbort: boolean;
  readonly signal: AbortSignal | null;
  throwIfAborted(): void;
  isAborted(): boolean;
}

/*
 * Stops a data query at its `query_timeout`, or when an outer signal fires (a workflow step's
 * deadline: the run's time is up, or the run was terminated). The signal is also handed to the
 * plugin (its `context.signal`), so a plugin that honours it cancels its request instead of
 * leaving it running after the query has been given up on.
 */
export class AbortControllerHandler implements IAbortControllerHandler {
  public readonly timeoutMs: number;
  public readonly canAbort: boolean;
  private controller: AbortController | null = null;
  private timeoutRef: NodeJS.Timeout | null = null;
  private readonly onOuterAbort = () => this.controller?.abort(this.outerSignal?.reason);

  constructor(
    timeoutMs: number,
    private readonly outerSignal?: AbortSignal | null
  ) {
    this.timeoutMs = timeoutMs;
    this.canAbort = (Number.isFinite(timeoutMs) && timeoutMs > 0) || !!outerSignal;
  }

  start(): void {
    if (!this.canAbort) return;
    this.cleanup();
    this.controller = new AbortController();
    if (Number.isFinite(this.timeoutMs) && this.timeoutMs > 0) {
      this.timeoutRef = setTimeout(() => this.controller?.abort(), this.timeoutMs);
    }
    if (this.outerSignal) {
      if (this.outerSignal.aborted) this.onOuterAbort();
      else this.outerSignal.addEventListener('abort', this.onOuterAbort, { once: true });
    }
  }

  cleanup(): void {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
    this.outerSignal?.removeEventListener('abort', this.onOuterAbort);
  }

  get signal(): AbortSignal | null {
    return this.controller?.signal ?? null;
  }

  isAborted(): boolean {
    return this.controller?.signal?.aborted ?? false;
  }

  throwIfAborted(): void {
    if (this.canAbort && this.signal?.aborted) throw this.abortError();
  }

  createAbortPromise(): Promise<never> {
    return new Promise((_, reject) => {
      if (!this.controller) return;
      const onAbort = () => reject(this.abortError());
      if (this.controller.signal.aborted) return onAbort();
      this.controller.signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  /** The outer signal's reason when it caused the abort, else the query's own timeout. */
  private abortError(): QueryError {
    const reason = this.outerSignal?.aborted ? (this.outerSignal.reason as { message?: string } | undefined) : null;
    if (reason?.message) return new QueryError('Query stopped', reason.message, {});
    return new QueryError('Query timed out', `Defined query timeout of ${this.timeoutMs}ms exceeded.`, {});
  }
}
