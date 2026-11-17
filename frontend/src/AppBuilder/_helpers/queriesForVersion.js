/*
  Queries carry the version they belong to (app_version_id). Right after a version switch (picking a draft, creating
  one from a locked version) the canvas re-mounts and runs its queries before the editor has fetched the new version's,
  so the store still holds the previous version's: running them sends the old ids against the new version and files
  the results under ids the new version's code never reads ("0 waiting" on a draft that has data).
*/

/** How long a run waits for the version's own queries before giving up. */
export const VERSION_QUERIES_WAIT_MS = 10000;

const versionOf = (query) => query?.app_version_id ?? query?.appVersionId;

/** Whether these queries belong to the version (queries without a version, or no version yet, count as current). */
export const queriesBelongToVersion = (queries, versionId) =>
  !versionId || !queries?.length || queries.every((q) => !versionOf(q) || versionOf(q) === versionId);

/**
 * Resolves with the module's queries once they belong to the version on screen, or with null after `timeoutMs`.
 * `read` returns { queries, versionId } from the store at the moment it is called.
 */
export const waitForVersionQueries = (read, { timeoutMs = VERSION_QUERIES_WAIT_MS, intervalMs = 50 } = {}) =>
  new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const { queries, versionId } = read();
      if (queriesBelongToVersion(queries, versionId)) return resolve(queries);
      if (Date.now() - started >= timeoutMs) return resolve(null);
      setTimeout(check, intervalMs);
    };
    check();
  });
