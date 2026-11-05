// Refresh exists only for a query that has response caching on, in a workspace licensed for it.
// Otherwise a query behaves as it did before the response cache: no refresh() and no refresh request.
export const isQueryCacheLicensed = (state) => !!state?.license?.featureAccess?.queryResponseCache;

export const canRefreshQueryCache = (state, query) =>
  isQueryCacheLicensed(state) && query?.options?.responseCache?.enabled === true;
