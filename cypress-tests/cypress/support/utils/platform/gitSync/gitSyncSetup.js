import { pollUntil } from "Support/utils/platform/gitSync/poll";
import { getDefaultBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";

/**
 * GitHub HTTPS config payload from cypress.env.json.
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
 * @tjDom none - cy.apiGetGitSyncStatus (GET /api/git-sync/:orgId/status)
 */
export const getGitSyncStatusViaAPI = () =>
  cy.apiGetGitSyncStatus({ failOnStatusCode: false }).then((res) => (res.status === 200 ? res.body : null));

/**
 * @tjType gitSyncConfig.attemptSave
 * @tjBlock gitSync
 * @tjUsage attemptSaveGitConfigViaAPI(githubConfigPayload(base, { githubAppId: "0" }))
 * @tjDom none - cy.apiSaveGitSyncConfig (POST /api/git-sync/configs)
 */
export const attemptSaveGitConfigViaAPI = (payload) =>
  cy.apiSaveGitSyncConfig(payload, { failOnStatusCode: false });

/**
 * @tjType gitSyncConfig.attemptTestConnection
 * @tjBlock gitSync
 * @tjUsage attemptTestConnectionViaAPI(githubConfigPayload(base))
 * @tjDom none - cy.apiTestGitSyncConnection (POST /api/git-sync/test-connection)
 */
export const attemptTestConnectionViaAPI = (payload) =>
  cy.apiTestGitSyncConnection(payload, { failOnStatusCode: false });

/**
 * Turn branching (multi-branch mode) on or off.
 *
 * @tjType gitSyncConfig.setBranching
 * @tjBlock gitSync
 * @tjUsage setBranchingViaAPI(orgGitId, true)
 * @tjDom none - cy.apiSetGitSyncBranching (PUT /api/git-sync/:orgGitId/is-branching-enabled)
 */
export const setBranchingViaAPI = (orgGitId, isBranchingEnabled) =>
  cy.apiSetGitSyncBranching(orgGitId, isBranchingEnabled);

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
  cy
    .apiSaveGitSyncConfig(githubConfigPayload(branchName))
    .then((res) => {
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
 * @tjDom none - cy.apiDisableGitSync (PUT /api/git-sync/status/:orgGitId)
 */
export const disableGitSyncViaAPI = (orgGitId, gitType = "github_https") =>
  cy.apiDisableGitSync(orgGitId, gitType);

/**
 * @tjType gitSyncConfig.delete
 * @tjBlock gitSync
 * @tjUsage deleteGitSyncConfigViaAPI(orgGitId) - teardown
 * @tjDom none - cy.apiDeleteGitSyncConfig (DELETE /api/git-sync/:orgGitId?gitType=)
 */
export const deleteGitSyncConfigViaAPI = (orgGitId, gitType = "github_https") =>
  cy.apiDeleteGitSyncConfig(orgGitId, gitType, { failOnStatusCode: false });
