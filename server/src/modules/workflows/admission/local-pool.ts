import { workflowMetrics } from '@modules/workflows/governance-metrics';

/*
 * Per-pod limits on heavy local work (decision D43): Python processes and bundle builds each spawn
 * processes on the pod that runs them, so they are bounded per pod, not across pods. Work beyond the
 * pool's size waits its turn, first come first served; a waiter can give up through a signal.
 */

/** The work waited for a free slot longer than its caller allowed. */
export class PoolWaitAbortedError extends Error {
  constructor(
    readonly pool: string,
    reason?: unknown
  ) {
    super((reason as { message?: string } | undefined)?.message ?? `Gave up waiting for a free ${pool} slot`);
    this.name = 'PoolWaitAbortedError';
  }
}

interface Waiter {
  grant: () => void;
  reject: (error: Error) => void;
}

export class LocalPool {
  private active = 0;
  private readonly waiters: Waiter[] = [];

  constructor(
    readonly name: string,
    readonly size: number
  ) {}

  /** Runs `work` in a free slot, waiting for one if needed. `signal` abandons the wait (not the work). */
  async run<T>(work: () => Promise<T>, signal?: AbortSignal | null): Promise<T> {
    await this.acquire(signal);
    try {
      return await work();
    } finally {
      this.release();
    }
  }

  /** Slots in use and work waiting, for metrics and tests. */
  stats(): { active: number; waiting: number } {
    return { active: this.active, waiting: this.waiters.length };
  }

  private acquire(signal?: AbortSignal | null): Promise<void> {
    if (signal?.aborted) return Promise.reject(new PoolWaitAbortedError(this.name, signal.reason));
    if (this.active < this.size) {
      this.active++;
      return Promise.resolve();
    }
    workflowMetrics.poolWaited(this.name);
    return new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(new PoolWaitAbortedError(this.name, signal?.reason));
      };
      const waiter: Waiter = {
        // The releasing caller hands its slot straight over, so `active` doesn't change
        grant: () => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        },
        reject,
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      this.waiters.push(waiter);
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) next.grant();
    else this.active--;
  }
}

/*
 * Concurrent calls with the same key share one in-flight promise: two saves of the same workflow
 * version's packages run one build, and both callers get its outcome.
 */
export class SingleFlight<T> {
  private readonly inFlight = new Map<string, Promise<T>>();

  run(key: string, work: () => Promise<T>): Promise<T> {
    const running = this.inFlight.get(key);
    if (running) return running;
    const started = work().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, started);
    return started;
  }
}

/** The pools of this pod, created on first use with the sizes from the workflow limits. */
const podPools = new Map<string, LocalPool>();

export type PodPoolName = 'python' | 'bundle-build';

export function podPool(name: PodPoolName, size: number): LocalPool {
  let pool = podPools.get(name);
  if (!pool) {
    pool = new LocalPool(name, size);
    podPools.set(name, pool);
  }
  return pool;
}
