/**
 * Rejects if `operation` has not settled within `ms`.
 *
 * For best-effort I/O whose failure is survivable but whose *stalling* is not. A refused TCP
 * connection fails in milliseconds, but a black-holed host (a dropped-packet NetworkPolicy, a
 * sick node) leaves a client retrying against its connect timeout for tens of seconds. Callers
 * here would rather take the failure path immediately than wait.
 *
 * The timer is always cleared, so a short timeout cannot keep the event loop alive.
 */
export function withTimeout<T>(operation: PromiseLike<T>, ms: number, label = 'operation'): Promise<T> {
  let timer: NodeJS.Timeout;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([operation, expiry]).finally(() => clearTimeout(timer)) as Promise<T>;
}
