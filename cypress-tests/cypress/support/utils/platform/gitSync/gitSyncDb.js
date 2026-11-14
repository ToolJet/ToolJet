/**
 * Direct DB reads for git sync state the API does not expose (per-version
 * is_synced / is_stub / git_tree_sha). Needs `app_db` in cypress env, so it works
 * locally and in pr-qa but not against a hosted instance; keep DB asserts in
 * these helpers so UI flows still run without DB access.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// app_db_name points the reads at another database of the same server (e.g. a tj worktree's isolated DB).
const dbConfig = () =>
  Cypress.env("app_db_name") ? { ...Cypress.env("app_db"), database: Cypress.env("app_db_name") } : Cypress.env("app_db");

const runQuery = (sql) => cy.task("dbConnection", { dbconfig: dbConfig(), sql });

/**
 * Every app_versions row of an app on one workspace branch (all branches when
 * `branchId` is omitted), oldest first.
 * A first pull stores lazy stub rows (is_stub=true, git_tree_sha = tree of `apps/<name>`);
 * opening the app in the editor hydrates them (is_stub=false)
 *
 * @tjType gitSyncDb.versionSyncState
 * @tjBlock gitSync
 * @tjUsage getVersionSyncStateViaDB({ appId, branchId: ctx.defaultBranch.id }).then((rows) => rows[0].isSynced)
 * @tjDom none - SQL on app_versions join apps
 * @param {{appId:string, branchId?:string}} p
 * @returns {Cypress.Chainable<Array<{id, name, status, versionType, isSynced, isStub, gitTreeSha, coRelationId}>>}
 */
export const getVersionSyncStateViaDB = ({ appId, branchId }) => {
  expect(appId, "appId is a uuid").to.match(UUID);
  if (branchId) expect(branchId, "branchId is a uuid").to.match(UUID);
  return runQuery(`
    SELECT av.id, av.name, av.status, av.version_type, av.is_synced, av.is_stub, av.git_tree_sha,
           a.co_relation_id
    FROM app_versions av
    JOIN apps a ON a.id = av.app_id
    WHERE av.app_id = '${appId}'${branchId ? ` AND av.branch_id = '${branchId}'` : ""}
    ORDER BY av.created_at ASC;
  `).then((resp) =>
    (resp.rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      versionType: r.version_type,
      isSynced: r.is_synced,
      isStub: r.is_stub,
      gitTreeSha: r.git_tree_sha,
      coRelationId: r.co_relation_id,
    })),
  );
};
