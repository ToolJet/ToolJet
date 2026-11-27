import { resolveWorkflowLimits } from '@modules/workflows/limits/workflow-limits';
import { HttpException, HttpStatus } from '@nestjs/common';

/*
 * Open run streams (SSE) per client IP on this pod (R17): each holds a connection and a Redis
 * subscription for as long as the client keeps it open. Per pod and in memory, since a connection
 * lives on the pod that serves it.
 */
export class StreamLimiter {
  private readonly open = new Map<string, number>();

  constructor(private readonly maxPerIp: number) {}

  /** Counts a new stream for `ip`; returns its release, or throws 429 past the limit. */
  admit(ip: string | undefined): () => void {
    const key = ip || 'unknown';
    const count = this.open.get(key) ?? 0;
    if (count >= this.maxPerIp) {
      throw new HttpException(
        `Too many open workflow run streams from this address (WORKFLOW_LIMIT_STREAMS_PER_IP)`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    this.open.set(key, count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const left = (this.open.get(key) ?? 1) - 1;
      if (left > 0) this.open.set(key, left);
      else this.open.delete(key);
    };
  }
}

let podStreamLimiter: StreamLimiter | undefined;

/** This pod's stream limiter, sized from the workflow limits on first use. */
export function streamLimiter(): StreamLimiter {
  return (podStreamLimiter ??= new StreamLimiter(resolveWorkflowLimits(process.env).concurrency.streamsPerIp));
}
