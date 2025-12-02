import { QueryError } from '@tooljet/plugins';

export interface IAbortControllerHandler {
  readonly timeoutMs: number;
  readonly canAbort: boolean;
  readonly signal: AbortSignal | null;
  throwIfAborted(): void;
  isAborted(): boolean;
}

export class AbortControllerHandler implements IAbortControllerHandler {
  public readonly timeoutMs: number;
  public readonly canAbort: boolean;
  private controller: AbortController | null = null;
  private timeoutRef: NodeJS.Timeout | null = null;

  constructor(timeoutMs: number) {
    this.timeoutMs = timeoutMs;
    this.canAbort = Number.isFinite(timeoutMs) && timeoutMs > 0;
  }

  start(): void {
    if (!this.canAbort) return;
    this.cleanup();
    this.controller = new AbortController();
    this.timeoutRef = setTimeout(() => this.controller?.abort(), this.timeoutMs);
  }

  cleanup(): void {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
  }

  get signal(): AbortSignal | null {
    return this.controller?.signal ?? null;
  }

  isAborted(): boolean {
    return this.controller?.signal?.aborted ?? false;
  }

  throwIfAborted(): void {
    if (this.canAbort && this.signal?.aborted) {
      throw new QueryError('Query timed out', `Defined query timeout of ${this.timeoutMs}ms exceeded.`, {});
    }
  }

  createAbortPromise(): Promise<never> {
    return new Promise((_, reject) => {
      if (!this.controller) return;
      const onAbort = () =>
        reject(new QueryError('Query timed out', `Defined query timeout of ${this.timeoutMs}ms exceeded.`, {}));
      if (this.controller.signal.aborted) return onAbort();
      this.controller.signal.addEventListener('abort', onAbort, { once: true });
    });
  }
}
