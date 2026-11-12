/**
 * Polling primitive for git sync state. Git sync work runs on background jobs
 * (branch create / delete / pull — server/ee/workspace-branches/git-sync-queue.service.ts)
 * and on GitHub, so tests wait for real state instead of fixed cy.wait() delays.
 */

/**
 * Re-run `fetch` until `isDone(result)` is truthy, then yield the result.
 *
 * @tjType gitSync.poll
 * @tjBlock gitSync
 * @tjUsage pollUntil(() => listBranchesViaAPI(), (r) => r.branches.length > 1, { label: "branch listed" })
 * @tjDom none - polling helper
 *
 * @param {() => Cypress.Chainable} fetch - chainable that yields the current state
 * @param {(result: any) => boolean} isDone - predicate on the yielded state
 * @param {{retries?: number, interval?: number, label?: string}} [opts]
 */
export const pollUntil = (fetch, isDone, opts = {}) => {
  const { retries = 30, interval = 3000, label = "condition" } = opts;

  const attempt = (remaining) =>
    fetch().then((result) => {
      if (isDone(result)) {
        Cypress.log({ name: "pollUntil", message: `${label} — met` });
        return cy.wrap(result, { log: false });
      }
      if (remaining <= 0) {
        throw new Error(
          `[gitSync] Timed out waiting for ${label} (${retries} tries × ${interval}ms)`,
        );
      }
      return cy
        .wait(interval, { log: false })
        .then(() => attempt(remaining - 1));
    });

  return attempt(retries);
};
