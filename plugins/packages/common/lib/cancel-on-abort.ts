/** A pending request that can be cancelled, such as got's (got 11 has no `signal` option). */
type CancelableRequest<T> = Promise<T> & { cancel?: (reason?: string) => void };

/*
 * Cancels `request` when `signal` fires: the caller (a query timeout, a workflow step's deadline)
 * has given up on it, so the request should stop rather than run on unobserved. The request then
 * rejects as cancelled. Without a signal the request is returned untouched.
 */
export function cancelOnAbort<T>(request: CancelableRequest<T>, signal?: AbortSignal): CancelableRequest<T> {
  if (!signal || typeof request.cancel !== 'function') return request;
  const onAbort = () => request.cancel(abortMessage(signal));
  if (signal.aborted) {
    onAbort();
    return request;
  }
  signal.addEventListener('abort', onAbort, { once: true });
  const detach = () => signal.removeEventListener('abort', onAbort);
  request.then(detach, detach);
  return request;
}

function abortMessage(signal: AbortSignal): string {
  const reason = signal.reason as { message?: string } | string | undefined;
  return typeof reason === 'string' ? reason : reason?.message ?? 'The request was cancelled';
}

/** A got request also reports its download progress. */
type ProgressRequest<T> = CancelableRequest<T> & {
  on?: (event: 'downloadProgress', listener: (progress: { transferred: number }) => void) => unknown;
};

/** The response was bigger than the caller accepts; it was cancelled while downloading. */
export class ResponseTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`The response is larger than the ${maxBytes} bytes allowed, so it was not read in full`);
    this.name = 'ResponseTooLargeError';
  }
}

/*
 * Stops reading a response once it passes `maxBytes` (a workflow's response cap, R11), instead of
 * buffering all of it in memory first. Without a cap the request is returned untouched.
 */
export function limitResponseSize<T>(request: ProgressRequest<T>, maxBytes?: number): Promise<T> {
  if (!(maxBytes > 0) || typeof request.on !== 'function' || typeof request.cancel !== 'function') return request;
  let exceeded = false;
  request.on('downloadProgress', ({ transferred }) => {
    if (!exceeded && transferred > maxBytes) {
      exceeded = true;
      request.cancel('Response too large');
    }
  });
  return request.catch((error) => {
    throw exceeded ? new ResponseTooLargeError(maxBytes) : error;
  });
}
