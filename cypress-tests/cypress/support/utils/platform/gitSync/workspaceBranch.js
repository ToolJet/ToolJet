import { pollUntil } from "Support/utils/platform/gitSync/poll";
import {
  getBranchHeadViaAPI,
  waitForRemoteBranchViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";

/**
 * ToolJet workspace-branch API (`/api/workspace-branches/*`).
 * source: server/src/modules/workspace-branches/controller.ts
 *
 * Branch create / delete / pull are enqueued on `git-sync-queue` and only run
 * on a WORKER=true process (server/src/modules/workspace-branches/module.ts:83),
 * so every mutating helper here waits for the resulting state.
 */

const tjRequest = (method, path, { body, qs, failOnStatusCode = true } = {}) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api${path}`,
      headers,
      body,
      qs,
      failOnStatusCode,
    }),
  );

const normalizeBranch = (b) => ({
  id: b.id,
  name: b.name ?? b.branch_name,
  isDefault: b.is_default ?? b.isDefault ?? false,
  lastSyncedCommit: b.last_synced_commit ?? b.lastSyncedCommit ?? null,
  // Category tree SHAs, stored per category on a clean pull (workspace_branch.entity.ts:36-53).
  appsGitTreeSha: b.apps_git_tree_sha ?? b.appsGitTreeSha ?? null,
  modulesGitTreeSha: b.modules_git_tree_sha ?? b.modulesGitTreeSha ?? null,
  dataSourcesGitTreeSha: b.data_sources_git_tree_sha ?? b.dataSourcesGitTreeSha ?? null,
  workflowsGitTreeSha: b.workflows_git_tree_sha ?? b.workflowsGitTreeSha ?? null,
  sourceBranchId: b.source_branch_id ?? b.sourceBranchId ?? null,
  raw: b,
});

/**
 * @tjType workspaceBranch.list
 * @tjBlock gitSync
 * @tjUsage listBranchesViaAPI().then(({ branches, activeBranchId }) => ...)
 * @tjDom none - GET /api/workspace-branches
 */
export const listBranchesViaAPI = () =>
  tjRequest("GET", "/workspace-branches").then((res) => {
    const body = res.body || {};
    const list = Array.isArray(body) ? body : body.branches || [];
    return {
      branches: list.map(normalizeBranch),
      activeBranchId: body.active_branch_id ?? body.activeBranchId ?? null,
      isMultiBranchingEnabled:
        body.is_multi_branching_enabled ?? body.isMultiBranchingEnabled ?? null,
    };
  });

/**
 * @tjType workspaceBranch.get
 * @tjBlock gitSync
 * @tjUsage getBranchViaAPI(name).then((branch) => branch?.id)
 * @tjDom none - GET /api/workspace-branches
 * @returns {Cypress.Chainable<object|null>}
 */
export const getBranchViaAPI = (name) =>
  listBranchesViaAPI().then(({ branches }) => branches.find((b) => b.name === name) || null);

/**
 * @tjType workspaceBranch.getDefault
 * @tjBlock gitSync
 * @tjUsage getDefaultBranchViaAPI().then((branch) => ...)
 * @tjDom none - GET /api/workspace-branches
 */
export const getDefaultBranchViaAPI = () =>
  listBranchesViaAPI().then(({ branches }) => branches.find((b) => b.isDefault) || null);

/**
 * POST a branch-create request without asserting the outcome.
 * Pair with verify helpers in denial / validation cases.
 *
 * @tjType workspaceBranch.attemptCreate
 * @tjBlock gitSync
 * @tjUsage attemptCreateBranchViaAPI("bad name").then((res) => expect(res.status).to.eq(400))
 * @tjDom none - POST /api/workspace-branches
 */
export const attemptCreateBranchViaAPI = (name, opts = {}) =>
  tjRequest("POST", "/workspace-branches", {
    body: { name, ...opts },
    failOnStatusCode: false,
  });

/**
 * Create a branch and wait until the background job has both inserted the
 * ToolJet row and created the remote ref.
 *
 * @tjType workspaceBranch.create
 * @tjBlock gitSync
 * @tjUsage createBranchViaAPI(`${prefix}-feature`).then((branch) => branch.id)
 * @tjDom none - POST /api/workspace-branches, then polls list + GitHub ref
 * @param {string} name
 * @param {{sourceBranchId?:string, commitSha?:string, appId?:string, versionId?:string, confirmImport?:boolean}} [opts]
 */
export const createBranchViaAPI = (name, opts = {}) =>
  attemptCreateBranchViaAPI(name, opts)
    .then((res) => {
      expect(res.status, `create branch ${name}: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]);
    })
    .then(() => waitForRemoteBranchViaAPI(name))
    .then(() =>
      pollUntil(() => getBranchViaAPI(name), (b) => !!b, {
        label: `branch ${name} listed in ToolJet`,
      }),
    );

/**
 * @tjType workspaceBranch.switch
 * @tjBlock gitSync
 * @tjUsage switchBranchViaAPI(branch.id)
 * @tjDom none - PUT /api/workspace-branches/:id/activate
 * @returns {Cypress.Chainable<{resolvedAppId?:string, slug?:string}>}
 */
export const switchBranchViaAPI = (branchId, appId) =>
  tjRequest("PUT", `/workspace-branches/${branchId}/activate`, {
    body: appId ? { appId } : {},
  }).then((res) => res.body || {});

/**
 * @tjType workspaceBranch.attemptDelete
 * @tjBlock gitSync
 * @tjUsage attemptDeleteBranchViaAPI(defaultBranch.id).then((res) => ...)
 * @tjDom none - DELETE /api/workspace-branches/:id
 */
export const attemptDeleteBranchViaAPI = (branchId) =>
  tjRequest("DELETE", `/workspace-branches/${branchId}`, { failOnStatusCode: false });

/**
 * Delete a branch and wait until it is gone from ToolJet and the remote.
 *
 * @tjType workspaceBranch.delete
 * @tjBlock gitSync
 * @tjUsage deleteBranchViaAPI(branch)
 * @tjDom none - DELETE /api/workspace-branches/:id, then polls
 * @param {{id:string, name:string}} branch
 */
export const deleteBranchViaAPI = (branch) =>
  attemptDeleteBranchViaAPI(branch.id)
    .then((res) => {
      expect(res.status, `delete branch ${branch.name}`).to.be.oneOf([200, 202, 204]);
    })
    .then(() =>
      pollUntil(() => getBranchViaAPI(branch.name), (b) => !b, {
        label: `branch ${branch.name} removed from ToolJet`,
      }),
    )
    .then(() => waitForRemoteBranchViaAPI(branch.name, { exists: false }));

/**
 * @tjType workspaceBranch.attemptPush
 * @tjBlock gitSync
 * @tjUsage attemptPushWorkspaceViaAPI({ branchId, commitMessage }).then((res) => ...)
 * @tjDom none - POST /api/workspace-branches/push
 * @param {{branchId:string, commitMessage:string, scope?:string, targetBranch?:string, onlyUnsyncedDatasources?:boolean}} body
 */
export const attemptPushWorkspaceViaAPI = (body) =>
  tjRequest("POST", "/workspace-branches/push", { body, failOnStatusCode: false });

/**
 * Workspace push (data sources and other workspace resources). Push is synchronous.
 *
 * @tjType workspaceBranch.push
 * @tjBlock gitSync
 * @tjUsage pushWorkspaceViaAPI({ branchId, commitMessage: "feat: ds" })
 * @tjDom none - POST /api/workspace-branches/push
 */
export const pushWorkspaceViaAPI = (body) =>
  attemptPushWorkspaceViaAPI(body).then((res) => {
    expect(res.status, `workspace push: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]);
    return res.body;
  });

/**
 * @tjType workspaceBranch.attemptPull
 * @tjBlock gitSync
 * @tjUsage attemptPullWorkspaceViaAPI(branchId).then((res) => expect(res.status).to.eq(409))
 * @tjDom none - POST /api/workspace-branches/pull
 */
export const attemptPullWorkspaceViaAPI = (branchId) =>
  tjRequest("POST", "/workspace-branches/pull", {
    body: branchId ? { branchId } : {},
    failOnStatusCode: false,
  });

/**
 * Pull `branch` from git and wait until ToolJet has recorded the remote head
 * as its last synced commit (set when the pull job finishes —
 * server/ee/workspace-branches/service.ts `lastSyncedCommit`). When the remote
 * head has not moved the server skips the pull and answers `{ upToDate: true }`
 * (server/ee/workspace-branches/service.ts:1056-1058).
 *
 * @tjType workspaceBranch.pull
 * @tjBlock gitSync
 * @tjUsage pullWorkspaceViaAPI(defaultBranch).then(({ upToDate, branch }) => ...)
 * @tjDom none - POST /api/workspace-branches/pull, then polls list
 * @param {{id:string, name:string}} branch
 * @returns {Cypress.Chainable<{upToDate:boolean, body:object, branch:object}>} branch is the refreshed row
 */
export const pullWorkspaceViaAPI = (branch) =>
  getBranchHeadViaAPI(branch.name).then((remoteHead) =>
    attemptPullWorkspaceViaAPI(branch.id).then((res) => {
      expect(res.status, `pull ${branch.name}: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201, 202]);
      const body = res.body || {};
      return waitForPullToFinish(branch.name, remoteHead).then((refreshed) => ({
        upToDate: body.upToDate === true,
        body,
        branch: refreshed,
      }));
    }),
  );

/**
 * Wait for the background pull job: ToolJet records the remote head as the
 * branch's last synced commit when the pull finishes. UI pulls return before that.
 *
 * @tjType workspaceBranch.waitForPull
 * @tjBlock gitSync
 * @tjUsage waitForPullToFinish(ctx.baseBranch, mergedHead)
 * @tjDom none - polls GET /api/workspace-branches
 */
export const waitForPullToFinish = (branchName, remoteHead) =>
  pollUntil(
    () => getBranchViaAPI(branchName),
    (b) => !!b && b.lastSyncedCommit === remoteHead,
    { label: `pull of ${branchName} at ${remoteHead?.slice(0, 7)} finished` },
  );

/**
 * @tjType workspaceBranch.checkUpdates
 * @tjBlock gitSync
 * @tjUsage checkForUpdatesViaAPI(branchName).then(({ hasUpdates, latestCommit }) => ...)
 * @tjDom none - GET /api/workspace-branches/check-updates?branch=
 */
export const checkForUpdatesViaAPI = (branchName) =>
  tjRequest("GET", "/workspace-branches/check-updates", {
    qs: { branch: branchName },
  }).then((res) => ({
    hasUpdates: res.body?.has_updates ?? res.body?.hasUpdates,
    latestCommit: res.body?.latest_commit ?? res.body?.latestCommit ?? null,
  }));

/**
 * Hydrate a stub version created by a pull so API-only flows have a real draft.
 *
 * @tjType workspaceBranch.ensureDraft
 * @tjBlock gitSync
 * @tjUsage ensureDraftViaAPI(appId, branchId)
 * @tjDom none - POST /api/workspace-branches/ensure-draft
 */
export const ensureDraftViaAPI = (appId, branchId) =>
  tjRequest("POST", "/workspace-branches/ensure-draft", {
    body: { appId, branchId },
  }).then((res) => res.body);
