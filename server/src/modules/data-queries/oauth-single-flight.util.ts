/**
 * Share one in-flight async operation per key.
 *
 * Concurrent callers with the same key await the same promise instead of
 * racing parallel executions — the OAuth refresh path uses this so that every
 * Run-on-Page-Load query hitting the same expired datasource shares ONE
 * refresh (providers with single-use refresh tokens invalidate the losers of
 * a race, cascading every query into a manual re-auth redirect). The entry is
 * removed when the operation settles, so a later expiry refreshes again.
 */
export const singleFlight = <T>(inFlight: Map<string, Promise<T>>, key: string, factory: () => Promise<T>): Promise<T> => {
  const existing = inFlight.get(key);
  if (existing) return existing;

  const operation = factory().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, operation);
  return operation;
};
