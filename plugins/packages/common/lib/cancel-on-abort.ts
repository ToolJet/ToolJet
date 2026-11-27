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
