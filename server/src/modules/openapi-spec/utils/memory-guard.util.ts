import * as os from 'os';
import * as v8 from 'v8';

export interface MemoryGuardOptions {
  // Fraction of the effective ceiling at which we abort (e.g. 0.6 = stop at 60%).
  ceilingRatio?: number;
}

// A real OOM in V8 is generally NOT a catchable JS exception - the process just gets killed
// (either by V8's own "FATAL ERROR: Reached heap limit" abort, or the OS OOM-killer). The only
// reliable way to avoid a crash is to check memory proactively, BEFORE the next allocation, and
// stop early with a normal, catchable error. This only works for bounded steps (batches) -
// SwaggerParser.resolve() itself is comparatively cheap (unlike validate(), it doesn't expand
// every $ref up front), so the real risk surface this guards is the per-batch
// dereference+persist loop, not resolve() itself.
export class MemoryGuard {
  private readonly effectiveLimitMB: number;
  private readonly ceilingMB: number;

  constructor(options: MemoryGuardOptions = {}) {
    const envRatio = parseFloat(process.env.OPENAPI_SPEC_MEMORY_CEILING_RATIO);
    const ceilingRatio = options.ceilingRatio ?? (isNaN(envRatio) ? 0.8 : envRatio);

    // Respect whichever is smaller: Node's own configured heap ceiling (--max-old-space-size,
    // or its default), or the actual machine's total RAM. A generous default V8 heap limit is
    // meaningless protection on a box that doesn't physically have that much memory - this is
    // what makes the ceiling adapt to "the resource this worker actually has".
    const heapLimitMB = Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024);
    const totalSystemMB = Math.round(os.totalmem() / 1024 / 1024);
    this.effectiveLimitMB = Math.min(heapLimitMB, totalSystemMB);
    this.ceilingMB = Math.round(this.effectiveLimitMB * ceilingRatio);
  }

  currentHeapUsedMB(): number {
    return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
  }

  // Call this between bounded units of work (batches). Throws a normal Error - caught by the
  // processor's existing try/catch, which marks the job FAILED with this message - instead of
  // letting the process silently grind toward an uncontrolled crash.
  assertWithinCeiling(stageLabel: string): void {
    const usedMB = this.currentHeapUsedMB();
    if (usedMB >= this.ceilingMB) {
      throw new Error(
        `Memory ceiling reached during "${stageLabel}": ${usedMB}MB heap used, ceiling is ${this.ceilingMB}MB ` +
          `(${Math.round((this.ceilingMB / this.effectiveLimitMB) * 100)}% of this process's effective ` +
          `${this.effectiveLimitMB}MB limit - min(V8 heap_size_limit, os.totalmem())). Aborting before an ` +
          `out-of-memory crash rather than continuing. Lower the batch size, raise ` +
          `OPENAPI_SPEC_MEMORY_CEILING_RATIO, or run on a machine with more memory.`
      );
    }
  }

  describe() {
    return { effectiveLimitMB: this.effectiveLimitMB, ceilingMB: this.ceilingMB };
  }
}
