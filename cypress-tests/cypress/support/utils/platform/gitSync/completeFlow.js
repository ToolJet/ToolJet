import {
  openAppFromDashboardViaUI,
  pullCommitInEditorViaUI,
  pullCommitInWorkflowViaUI,
  runWorkflowAndReadNodeOutputViaUI,
} from "Support/utils/platform/gitSync/gitSyncUI";

// Checks shared by the complete-flow specs (fixture: cypress/fixtures/gitSync/complete-flow).
export const todoTitles = {
  1: "delectus aut autem",
  2: "quis ut nam facilis et officia qui",
  3: "fugiat veniam minus",
};

// Page name in the app's page menu → [page handle in the URL, text the page shows].
export const appPages = {
  Home: ["home", todoTitles[1]],
  module: ["module", "alpha"],
  workflow: ["workflow", todoTitles[2]],
};

/**
 * @tjType completeFlow.openPage
 * @tjBlock gitSync
 * @tjUsage openAppPage("module")
 * @tjDom button[aria-label="<page>"]
 */
export const openAppPage = (page) => cy.get(`button[aria-label="${page}"]`).filter(":visible").first().click();

/**
 * Click through every page of the open app in the editor and check what each shows.
 *
 * @tjType completeFlow.verifyPagesInEditor
 * @tjBlock gitSync
 * @tjUsage verifyPagesInEditor({ module: "beta" })
 * @tjDom button[aria-label="<page>"] → #real-canvas
 */
export const verifyPagesInEditor = (overrides = {}) => {
  Object.entries(appPages).forEach(([page, [, text]]) => {
    openAppPage(page);
    cy.get("#real-canvas", { timeout: 60000 }).should("contain.text", overrides[page] ?? text);
  });
};

/**
 * Open each page of the released app by its URL handle and check what it shows.
 *
 * @tjType completeFlow.verifyReleasedPages
 * @tjBlock gitSync
 * @tjUsage verifyReleasedPages(slug)
 * @tjDom /applications/<slug>/<page handle>
 */
export const verifyReleasedPages = (slug, overrides = {}) => {
  Object.entries(appPages).forEach(([page, [handle, text]]) => {
    cy.visit(`/applications/${slug}/${handle}`);
    cy.get("body", { timeout: 60000 }).should("contain.text", overrides[page] ?? text);
  });
};

/**
 * Open a module's draft on `branch` and check it shows `text`. A workspace pull doesn't refresh
 * a loaded draft yet (known issue), so when opening it hasn't brought the change in, pull inside the module.
 *
 * @tjType completeFlow.verifyModuleDraft
 * @tjBlock gitSync
 * @tjUsage verifyModuleDraftViaUI(ctx, ctx.baseBranch, flow.names.module, "beta", "alpha")
 * @tjDom /modules → Edit → #real-canvas (+ [data-cy="lifecycle-cta-button"] Pull commit)
 */
export const verifyModuleDraftViaUI = (ctx, branch, moduleName, text, oldText) => {
  openAppFromDashboardViaUI(ctx, branch, moduleName, { page: "modules" });
  cy.get("#real-canvas", { timeout: 60000 })
    .should(($canvas) => expect($canvas.text()).to.match(new RegExp(`${oldText}|${text}`)))
    .then(($canvas) => {
      if ($canvas.text().includes(text)) return;
      pullCommitInEditorViaUI();
      cy.reload();
    });
  cy.get("#real-canvas", { timeout: 60000 }).should("contain.text", text).and("not.contain.text", oldText);
};

/**
 * Run a workflow's draft on `branch` and check `nodeName` returned `text`. Same pull fallback as modules.
 *
 * @tjType completeFlow.verifyWorkflowDraft
 * @tjBlock gitSync
 * @tjUsage verifyWorkflowDraftViaUI(ctx, ctx.baseBranch, flow.names.workflow, "getTodo2", todoTitles[3])
 * @tjDom /workflows → Edit → [data-cy="workflow-run-button"] → logs panel output
 */
export const verifyWorkflowDraftViaUI = (ctx, branch, workflowName, nodeName, text) => {
  openAppFromDashboardViaUI(ctx, branch, workflowName, { page: "workflows" });
  runWorkflowAndReadNodeOutputViaUI(nodeName).then((output) => {
    if (output.includes(text)) return;
    pullCommitInWorkflowViaUI();
    cy.reload();
    runWorkflowAndReadNodeOutputViaUI(nodeName).should("contain", text);
  });
};
