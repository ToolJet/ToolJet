import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";

/**
 * Dashboard-level git sync UI helpers (branch dropdown, create/switch modals,
 * workspace commit/pull modal). The header git controls render only on
 * `/<ws>`, `/data-sources`, `/modules`, `/workflows` for admins and builders
 * (frontend/src/_ui/Header/index.jsx:84-88, 180-198).
 */

/**
 * Visit a workspace page with the branch selected through `?branch=`
 * (source of truth for the active branch: frontend/src/_helpers/active-branch.js).
 *
 * @tjType gitSyncUI.visit
 * @tjBlock gitSync
 * @tjUsage visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "data-sources" })
 * @tjDom [data-cy="workspace-branch-dropdown-header"]
 */
export const visitGitSyncPage = (ctx, { branch, page = "" } = {}) => {
  const path = [ctx.workspaceSlug, page].filter(Boolean).join("/");
  cy.visit(`/${path}${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`, {
    redirectionLimit: 20,
  });
  cy.get(GS.wsCurrentBranch, { timeout: 30000 }).should("be.visible");
};

/**
 * @tjType gitSyncUI.openBranchPopover
 * @tjBlock gitSync
 * @tjUsage openBranchPopover()
 * @tjDom [data-cy="workspace-branch-dropdown-popover"]
 */
export const openBranchPopover = () => {
  cy.get("body").then(($body) => {
    if ($body.find(GS.wsBranchPopover).length === 0) cy.get(GS.wsBranchHeader).click();
  });
  cy.get(GS.wsBranchPopover).should("be.visible");
};

/**
 * Open the Create branch modal and type a name. Does not submit or assert
 * the result — callers verify validation errors or the success toast.
 *
 * @tjType gitSyncUI.fillCreateBranch
 * @tjBlock gitSync
 * @tjUsage fillCreateBranchViaUI("feature-x")
 * @tjDom [data-cy="workspace-create-branch-btn"] → [data-cy="branch-name-input"]
 */
export const fillCreateBranchViaUI = (name) => {
  openBranchPopover();
  cy.get(GS.wsCreateBranchBtn).click();
  cy.get(GS.branchNameInput).should("be.visible").clear();
  if (name) cy.get(GS.branchNameInput).type(name);
};

/**
 * @tjType gitSyncUI.switchBranch
 * @tjBlock gitSync
 * @tjUsage switchBranchViaUI("feature-x")
 * @tjDom [data-cy="workspace-switch-branch-btn"] → [data-cy="workspace-branch-list-item-<name>"]
 */
export const switchBranchViaUI = (name) => {
  openBranchPopover();
  cy.get(GS.wsSwitchBranchBtn).click();
  cy.get(GS.switchBranchSearch).should("be.visible").clear().type(name);
  cy.get(GS.switchBranchItem(name)).should("be.visible").click();
};

/**
 * Commit from the dashboard / data sources commit modal. Asserts only that the
 * button is gated on a message; callers verify the toast and the remote commit.
 *
 * @tjType gitSyncUI.commitWorkspace
 * @tjBlock gitSync
 * @tjUsage commitWorkspaceViaUI("feat: data sources")
 * @tjDom [data-cy="workspace-git-commit-button"] → [data-cy="commit-message-input"] → [data-cy="commit-button"]
 */
export const commitWorkspaceViaUI = (message) => {
  cy.get(GS.wsCommitButton).should("be.visible").click();
  cy.get(GS.commitMessageInput).should("be.visible").and("have.value", "");
  cy.get(GS.commitButton).should("be.disabled");
  cy.get(GS.commitMessageInput).type(message);
  cy.get(GS.commitButton).should("be.enabled").click();
};

/**
 * Open the dashboard Pull modal and pull the current branch. The update check
 * runs when the modal opens (frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:91).
 *
 * @tjType gitSyncUI.pullWorkspace
 * @tjBlock gitSync
 * @tjUsage pullWorkspaceViaUI()
 * @tjDom [data-cy="workspace-git-pull-button"] → [data-cy="pull-button"]
 */
export const pullWorkspaceViaUI = () => {
  cy.get(GS.wsPullButton).should("be.visible").click();
  cy.get(GS.gitModalTitle).should("be.visible");
  cy.get(GS.pullButton, { timeout: 30000 }).should("be.enabled").click();
};

// Configure-git page. Provider modal inputs have no data-cy; placeholders are
// the stable hook (frontend/ee/modules/WorkspaceSettings/pages/GitSync/providers/GithubHTTPS/GithubHTTPSModal.jsx:861-973).
const githubField = {
  gitUrl: 'input[placeholder="Enter HTTPS repo URL"]',
  branchName: 'input[placeholder="Enter Branch Name"]',
  githubEnterpriseUrl: 'input[placeholder="Enter GitHub enterprise URL (optional)"]',
  githubEnterpriseApiUrl: 'input[placeholder="Enter GitHub enterprise API URL (optional)"]',
  githubAppId: 'input[placeholder="Enter GitHub app ID"]',
  githubAppInstallationId: 'input[placeholder="Enter GitHub app installation ID"]',
  githubAppPrivateKey: 'textarea[placeholder="Enter GitHub app private key"], input[placeholder="Enter GitHub app private key"]',
};

// Credential fields are plain text inputs: type them without a command-log entry and mask
// them in the test browser so screenshots and videos never show the values.
const credentialFields = ["githubAppId", "githubAppInstallationId", "githubAppPrivateKey"];

/**
 * @tjType gitSyncUI.openGithubConfig
 * @tjBlock gitSync
 * @tjUsage openGithubConfigModal(ws)
 * @tjDom [data-cy="github-git-card"] → [data-cy="save-config-button"]
 */
export const openGithubConfigModal = (ws) => {
  cy.visit(`/${ws.workspaceSlug}/workspace-settings/configure-git`, { redirectionLimit: 20 });
  // source: .../GitSync/components/RepositoryConnections/RepositoryConnections.jsx (`${name}-git-card`)
  // The card only opens the modal once license/feature access has loaded; until
  // then its edit icon is visibility:hidden (RepositoryConnections.jsx:214, 257-262).
  // The icon's relative src may not load, so check its style rather than visibility.
  cy.get('[data-cy="github-edit-icon"]', { timeout: 30000 }).should(($img) => {
    expect($img[0].style.visibility, "provider card enabled").to.not.equal("hidden");
  });
  // The page refetches license + git config after mount and the re-render can drop
  // the modal's open state, so click until the modal is actually up.
  const openModal = (attempt) => {
    cy.get('[data-cy="github-git-card"]').click();
    cy.wait(1500, { log: false }); // let the modal mount before deciding to retry
    cy.get("body", { log: false }).then(($body) => {
      if ($body.find('[data-cy="save-config-button"]').length) return;
      if (attempt >= 5) throw new Error("[gitSync] GitHub config modal did not open");
      openModal(attempt + 1);
    });
  };
  openModal(1);
  cy.get('[data-cy="save-config-button"]').should("be.visible");
  credentialFields.forEach((key) =>
    cy.get(githubField[key]).invoke("css", "-webkit-text-security", "disc"),
  );
};

/**
 * Type GitHub HTTPS values into the provider modal. `values` keys follow
 * githubConfigPayload (gitUrl, branchName, githubAppId, githubAppInstallationId, githubAppPrivateKey);
 * omitted keys are left untouched, empty strings clear the field.
 *
 * @tjType gitSyncUI.fillGithubConfig
 * @tjBlock gitSync
 * @tjUsage fillGithubConfigViaUI(githubConfigPayload(base))
 * @tjDom input[placeholder="Enter HTTPS repo URL"] …
 */
export const fillGithubConfigViaUI = (values) => {
  Object.entries(githubField).forEach(([key, selector]) => {
    if (!(key in values)) return;
    const isCredential = credentialFields.includes(key);
    if (isCredential) cy.get(selector).invoke("css", "-webkit-text-security", "disc");
    cy.get(selector).clear();
    if (values[key]) cy.get(selector).type(String(values[key]), { delay: 0, log: !isCredential });
  });
};

/**
 * Field error rendered under a provider input (span.text-danger, no data-cy).
 *
 * @tjType gitSyncUI.githubFieldError
 * @tjBlock gitSync
 * @tjUsage githubFieldError("gitUrl").should("have.text", msg)
 * @tjDom input + span.text-danger
 */
export const githubFieldError = (key) =>
  cy.get(githubField[key]).first().closest(".form-group").find("span.text-danger");

/**
 * Open an app in the builder the way a user does: dashboard on `branch`,
 * hover the app card, click Edit. Deep-linking `/<ws>/apps/<uuid>` without the
 * dashboard first loops on GET /api/session, so always enter through the card.
 *
 * @tjType gitSyncUI.openApp
 * @tjBlock gitSync
 * @tjUsage openAppFromDashboardViaUI(ctx, branch.name, appName)
 * @tjDom [data-cy$="-card"] → a "Edit"
 */
export const openAppFromDashboardViaUI = (ctx, branch, appName) => {
  visitGitSyncPage(ctx, { branch });
  cy.contains('[data-cy$="-card"]', appName, { timeout: 30000 })
    .should("be.visible")
    .realHover();
  cy.contains('[data-cy$="-card"]', appName).contains("a", "Edit").should("be.visible").click();
  cy.url({ timeout: 30000 }).should("include", "/apps/");
  cy.get('[data-cy="lifecycle-cta-button"]', { timeout: 60000 }).should("be.visible");
};
