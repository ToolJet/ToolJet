import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { gitSyncText } from "Texts/platform/gitSync";

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

// Provider modal inputs have no data-cy; placeholders are the stable hook (GithubHTTPSModal.jsx:861-973).
const githubField = {
  gitUrl: 'input[placeholder="Enter HTTPS repo URL"]',
  branchName: 'input[placeholder="Enter Branch Name"]',
  githubEnterpriseUrl: 'input[placeholder="Enter GitHub enterprise URL (optional)"]',
  githubEnterpriseApiUrl: 'input[placeholder="Enter GitHub enterprise API URL (optional)"]',
  githubAppId: 'input[placeholder="Enter GitHub app ID"]',
  githubAppInstallationId: 'input[placeholder="Enter GitHub app installation ID"]',
  githubAppPrivateKey: 'textarea[placeholder="Enter GitHub app private key"], input[placeholder="Enter GitHub app private key"]',
};

// Credentials are typed without a log entry and masked so screenshots never show them.
const credentialFields = ["githubAppId", "githubAppInstallationId", "githubAppPrivateKey"];

/**
 * @tjType gitSyncUI.openGithubConfig
 * @tjBlock gitSync
 * @tjUsage openGithubConfigModal(ws)
 * @tjDom [data-cy="github-git-card"] → [data-cy="save-config-button"]
 */
export const openGithubConfigModal = (ws) => {
  cy.visit(`/${ws.workspaceSlug}/workspace-settings/configure-git`, { redirectionLimit: 20 });
  // The card's edit icon stays visibility:hidden until licence access loads (RepositoryConnections.jsx:214).
  cy.get('[data-cy="github-edit-icon"]', { timeout: 30000 }).should(($img) => {
    expect($img[0].style.visibility, "provider card enabled").to.not.equal("hidden");
  });
  // A re-render after mount can drop the modal, so click until it is up.
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
 * @tjUsage openAppFromDashboardViaUI(ctx, branch.name, appName) / (ctx, branch.name, moduleName, { page: "modules" })
 * @tjDom [data-cy$="-card"] → a "Edit"
 */
export const openAppFromDashboardViaUI = (ctx, branch, appName, { page = "" } = {}) => {
  visitGitSyncPage(ctx, { branch, page });
  cy.contains('[data-cy$="-card"]', appName, { timeout: 30000 })
    .should("be.visible")
    .realHover();
  cy.contains('[data-cy$="-card"]', appName).contains("a", "Edit").should("be.visible").click();
  cy.url({ timeout: 30000 }).should("include", "/apps/");
  // Modules and workflows lose the Commit CTA once a version is saved on the branch.
  cy.get(page ? GS.editorBranchHeader : GS.lifecycleCta, { timeout: 60000 }).should("be.visible");
};

/**
 * Save the open app, module or workflow as a named version from the editor's branch
 * dropdown. In branch mode this also tags `<co_relation_id>/<name>` on GitHub and
 * locks the resource on the current branch.
 *
 * @tjType gitSyncUI.saveVersion
 * @tjBlock gitSync
 * Single-branch mode has no Save version in the branch dropdown; pass { via: "versionMenu" }.
 *
 * @tjUsage saveVersionViaUI("v1") / saveVersionViaUI("v1", { via: "versionMenu" })
 * @tjDom [data-cy="branch-dropdown-header"] → [data-cy="save-version-btn"] → [data-cy="create-version-save-button"]
 */
export const saveVersionViaUI = (name, { via = "branchMenu" } = {}) => {
  if (via === "versionMenu") {
    cy.get(GS.versionSwitcherButton).should("be.visible").click();
    cy.get(GS.versionRowSaveButton).filter(":visible").first().should("be.enabled").click();
  } else {
    cy.get(GS.editorBranchHeader).should("be.visible").click();
    cy.get(GS.saveVersionBtn).should("be.visible").click();
  }
  cy.get(GS.versionNameInput).should("be.visible").clear().type(name);
  cy.get(GS.createVersionSaveBtn).should("be.enabled").click();
  cy.contains(`Version ${name} saved successfully`, { timeout: 30000 }).should("be.visible");
};

/**
 * Commit the open app from the app builder header.
 *
 * @tjType gitSyncUI.commitApp
 * @tjBlock gitSync
 * @tjUsage commitAppViaUI("feat: pin v1")
 * @tjDom [data-cy="lifecycle-cta-button"] → [data-cy="commit-message-input"] → [data-cy="commit-button"]
 */
export const commitAppViaUI = (message) => {
  // Commit enables before the modal's app-git config loads (catalogue F-02): wait for it.
  cy.intercept("GET", "**/api/app-git/*/app/*").as("appGitConfig");
  cy.get(GS.lifecycleCta).should("contain.text", "Commit").click();
  cy.wait("@appGitConfig").its("response.statusCode").should("eq", 200);
  cy.get(GS.commitMessageInput).should("be.visible").type(message);
  cy.get(GS.commitButton).should("be.enabled").click();
};

/**
 * Pull the open app or module from git with the editor's "Pull commit" on the default branch.
 *
 * @tjType gitSyncUI.pullCommitInEditor
 * @tjBlock gitSync
 * @tjUsage pullCommitInEditorViaUI()
 * @tjDom [data-cy="lifecycle-cta-button"] → [data-cy="pull-button"]
 */
export const pullCommitInEditorViaUI = () => {
  cy.get(GS.lifecycleCta).should("contain.text", "Pull commit").click();
  cy.get(GS.pullButton, { timeout: 60000 }).should("be.enabled").click();
  cy.contains(gitSyncText.editorPullSuccess, { timeout: 60000 }).should("be.visible");
};

/**
 * Run the open workflow from its editor and read one node's output from the logs panel.
 *
 * @tjType gitSyncUI.runWorkflowNode
 * @tjBlock gitSync
 * @tjUsage runWorkflowAndReadNodeOutputViaUI("getTodo2").then((text) => ...)
 * @tjDom [data-cy="workflow-run-button"] → [data-cy="<node>-node-name"] → [data-cy="tab-output"]
 * @returns {Cypress.Chainable<string>} the logs panel text with the node's output expanded
 */
export const runWorkflowAndReadNodeOutputViaUI = (nodeName) => {
  const node = nodeName.toLowerCase();
  cy.intercept("POST", "**/api/workflow_executions").as("workflowRun");
  cy.get(GS.workflowRunButton, { timeout: 60000 }).should("be.enabled").click();
  cy.wait("@workflowRun", { timeout: 60000 }).its("response.statusCode").should("be.oneOf", [200, 201]);
  cy.get(GS.workflowLogsPanel).within(() => {
    cy.contains(`${nodeName}:`, { timeout: 60000 }).should("exist");
    cy.contains("Execution succeeded", { timeout: 60000 }).should("exist");
    cy.get(`[data-cy="${node}-node-name"]`).click();
    cy.get('[data-cy="tab-output"]').click();
    // The output tree is collapsed; its "data" key toggles the response body open.
    cy.contains(/^data$/).click();
  });
  return cy.get(GS.workflowLogsPanel).invoke("text");
};

/**
 * Pull the open workflow from git with its editor's "Pull commit" on the default branch.
 *
 * @tjType gitSyncUI.pullCommitInWorkflow
 * @tjBlock gitSync
 * @tjUsage pullCommitInWorkflowViaUI()
 * @tjDom [data-cy="workflow-git-commit-button"] → [data-cy="pull-button"]
 */
export const pullCommitInWorkflowViaUI = () => {
  cy.get(GS.workflowGitButton).should("contain.text", "Pull commit").click();
  cy.get(GS.pullButton, { timeout: 60000 }).should("be.enabled").click();
  cy.contains(gitSyncText.editorPullSuccess, { timeout: 60000 }).should("be.visible");
};

/**
 * Select a widget on the canvas and open its Properties panel.
 *
 * @tjType gitSyncUI.openWidgetInspector
 * @tjBlock gitSync
 * @tjUsage openWidgetInspectorViaUI("moduleViewer1")
 * @tjDom [data-cy="draggable-widget-<name>"] → config handle "<name>"
 */
export const openWidgetInspectorViaUI = (widgetName) => {
  cy.get(`[data-cy="draggable-widget-${widgetName}"]`).click(5, 5, { force: true });
  cy.contains(".config-handle", widgetName).should("be.visible").click();
};

// ModuleViewer Version has no data-cy (ModuleViewerInspector.jsx:373) and reads as hidden when locked.
const moduleVersionField = () => cy.contains(".field", /^Version/, { timeout: 30000 }).first();

/**
 * Pin a ModuleViewer to a saved module version in the inspector.
 *
 * @tjType gitSyncUI.pinModuleVersion
 * @tjBlock gitSync
 * @tjUsage pinModuleViewerVersionViaUI("moduleViewer1", "v1")
 * @tjDom inspector .field "Version" → option "<version>"
 */
export const pinModuleViewerVersionViaUI = (widgetName, version) => {
  openWidgetInspectorViaUI(widgetName);
  moduleVersionField().find("label").next().click();
  cy.contains("Versions").should("be.visible");
  moduleVersionField().contains(new RegExp(`^${version}$`)).click();
  moduleVersionField().should("contain.text", version);
};

/**
 * @tjType gitSyncUI.verifyModuleVersion
 * @tjBlock gitSync
 * @tjUsage verifyModuleViewerVersion("moduleViewer1", "v1")
 */
export const verifyModuleViewerVersion = (widgetName, version) => {
  openWidgetInspectorViaUI(widgetName);
  moduleVersionField().find("label").next().should("contain.text", version);
};

/**
 * Pin a workflows query to a saved workflow version in the query editor.
 *
 * @tjType gitSyncUI.pinWorkflowVersion
 * @tjBlock gitSync
 * @tjUsage pinWorkflowQueryVersionViaUI("runWf", "v1")
 * @tjDom [data-cy="list-query-<query>"] → [data-cy="workflow-version-select"] → option "<version>"
 */
export const pinWorkflowQueryVersionViaUI = (queryName, version) => {
  cy.get(`[data-cy="list-query-${queryName.toLowerCase()}"]`).should("be.visible").click();
  cy.get(GS.workflowVersionSelect).should("be.visible").children().first().click();
  cy.get(GS.workflowVersionSelect).contains(new RegExp(`^${version}$`)).click();
  cy.get(GS.workflowVersionSelect).children().first().should("contain.text", version);
};

/**
 * @tjType gitSyncUI.verifyWorkflowVersion
 * @tjBlock gitSync
 * @tjUsage verifyWorkflowQueryVersion("runWf", "v1")
 */
export const verifyWorkflowQueryVersion = (queryName, version) => {
  cy.get(`[data-cy="list-query-${queryName.toLowerCase()}"]`).should("be.visible").click();
  cy.get(GS.workflowVersionSelect).children().first().should("contain.text", version);
};
