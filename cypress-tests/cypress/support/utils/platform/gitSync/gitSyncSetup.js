import { pollUntil } from "Support/utils/platform/gitSync/poll";
import { getDefaultBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";

/**
 * Git sync configuration API (`/api/git-sync/*`).
 * source: server/src/modules/git-sync/controller.ts, server/src/modules/git-sync-configs/controller.ts
 */

const tjRequest = (method, path, { body, failOnStatusCode = true } = {}) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api${path}`,
      headers,
      body,
      failOnStatusCode,
    }),
  );

/**
 * GitHub HTTPS config payload from cypress.env.json.
 * source: server/src/modules/git-sync/dto/provider-config.dto.ts (GithubHttpsConfigDTO)
 *
 * @tjType gitSyncConfig.githubPayload
 * @tjBlock gitSync
 * @tjUsage githubConfigPayload(baseBranch)
 * @tjDom none - pure function
 */
export const githubConfigPayload = (branchName, overrides = {}) => ({
  gitType: "github_https",
  gitUrl: Cypress.env("GITHUB_REPO_URL"),
  branchName,
  githubEnterpriseUrl: "",
  githubEnterpriseApiUrl: "",
  githubAppId: Cypress.env("GITHUB_APP_ID"),
  githubAppInstallationId: Cypress.env("GITHUB_APP_INSTALLATION_ID"),
  githubAppPrivateKey: Cypress.env("GITHUB_PRIVATE_KEY"),
  useEnvConfig: false,
  ...overrides,
});

/**
 * @tjType gitSyncConfig.status
 * @tjBlock gitSync
 * @tjUsage getGitSyncStatusViaAPI().then((status) => status.is_enabled)
 * @tjDom none - GET /api/git-sync/:orgId/status
 */
export const getGitSyncStatusViaAPI = () =>
  tjRequest("GET", `/git-sync/${Cypress.env("workspaceId")}/status`, {
    failOnStatusCode: false,
  }).then((res) => (res.status === 200 ? res.body : null));

/**
 * @tjType gitSyncConfig.attemptSave
 * @tjBlock gitSync
 * @tjUsage attemptSaveGitConfigViaAPI(githubConfigPayload(base, { githubAppId: "0" }))
 * @tjDom none - POST /api/git-sync/configs
 */
export const attemptSaveGitConfigViaAPI = (payload) =>
  tjRequest("POST", "/git-sync/configs", { body: payload, failOnStatusCode: false });

/**
 * @tjType gitSyncConfig.attemptTestConnection
 * @tjBlock gitSync
 * @tjUsage attemptTestConnectionViaAPI(githubConfigPayload(base))
 * @tjDom none - POST /api/git-sync/test-connection
 */
export const attemptTestConnectionViaAPI = (payload) =>
  tjRequest("POST", "/git-sync/test-connection", { body: payload, failOnStatusCode: false });

/**
 * Turn branching (multi-branch mode) on or off.
 * source: server/src/modules/git-sync-configs/controller.ts `:id/is-branching-enabled`
 *
 * @tjType gitSyncConfig.setBranching
 * @tjBlock gitSync
 * @tjUsage setBranchingViaAPI(orgGitId, true)
 * @tjDom none - PUT /api/git-sync/:orgGitId/is-branching-enabled
 */
export const setBranchingViaAPI = (orgGitId, isBranchingEnabled) =>
  tjRequest("PUT", `/git-sync/${orgGitId}/is-branching-enabled`, {
    body: { isBranchingEnabled },
  });

/**
 * Configure GitHub HTTPS git sync on `branchName`, set the branching mode, and
 * wait until ToolJet has seeded `branchName` as the default workspace branch.
 *
 * @tjType gitSyncConfig.setup
 * @tjBlock gitSync
 * @tjUsage configureGitSyncViaAPI({ branchName: base, mode: "multi" }).then(({ orgGitId, defaultBranch }) => ...)
 * @tjDom none - POST /api/git-sync/configs + PUT is-branching-enabled
 * @param {{branchName:string, mode?:"single"|"multi"}} opts
 */
export const configureGitSyncViaAPI = ({ branchName, mode = "multi" }) =>
  attemptSaveGitConfigViaAPI(githubConfigPayload(branchName))
    .then((res) => {
      expect(res.status, `save git config: ${JSON.stringify(res.body)}`).to.be.oneOf([200, 201]);
      expect(res.body?.data?.connection_message, "no connection error").to.be.undefined;
    })
    .then(() => getGitSyncStatusViaAPI())
    .then((status) => {
      expect(status?.is_git_sync_configured, "git sync configured").to.equal(true);
      return setBranchingViaAPI(status.id, mode === "multi").then(() => status.id);
    })
    .then((orgGitId) =>
      pollUntil(
        () => getDefaultBranchViaAPI(),
        (b) => !!b && b.name === branchName,
        { label: `default branch ${branchName} seeded` },
      ).then((defaultBranch) => ({ orgGitId, defaultBranch })),
    );

/**
 * Turn the provider off (keeps the config). Allowed even with an expired license.
 *
 * @tjType gitSyncConfig.disable
 * @tjBlock gitSync
 * @tjUsage disableGitSyncViaAPI(orgGitId)
 * @tjDom none - PUT /api/git-sync/status/:orgGitId
 */
export const disableGitSyncViaAPI = (orgGitId, gitType = "github_https") =>
  tjRequest("PUT", `/git-sync/status/${orgGitId}`, {
    body: { isEnabled: false, gitType },
  });

/**
 * @tjType gitSyncConfig.delete
 * @tjBlock gitSync
 * @tjUsage deleteGitSyncConfigViaAPI(orgGitId) - teardown
 * @tjDom none - DELETE /api/git-sync/:orgGitId?gitType=
 */
export const deleteGitSyncConfigViaAPI = (orgGitId, gitType = "github_https") =>
  tjRequest("DELETE", `/git-sync/${orgGitId}?gitType=${gitType}`, {
    failOnStatusCode: false,
  });
