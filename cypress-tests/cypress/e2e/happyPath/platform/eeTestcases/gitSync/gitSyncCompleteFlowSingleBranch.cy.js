import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  importCompleteFlowViaAPI,
  pushCompleteFlowViaAPI,
  getAppOnBranchViaAPI,
  releaseSavedVersionViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { waitForPullToFinish } from "Support/utils/platform/gitSync/workspaceBranch";
import {
  rewriteRepoFilesViaAPI,
  waitForCommitMessageViaAPI,
  waitForTagViaAPI,
  deleteTagsByPrefixViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import {
  visitGitSyncPage,
  pullWorkspaceViaUI,
  openAppFromDashboardViaUI,
  saveVersionViaUI,
  commitAppViaUI,
  pinModuleViewerVersionViaUI,
  pinWorkflowQueryVersionViaUI,
  verifyModuleViewerVersion,
  verifyWorkflowQueryVersion,
} from "Support/utils/platform/gitSync/gitSyncUI";
import {
  todoTitles,
  openAppPage,
  verifyPagesInEditor,
  verifyReleasedPages,
  verifyModuleDraftViaUI,
  verifyWorkflowDraftViaUI,
} from "Support/utils/platform/gitSync/completeFlow";

// Single-branch mode: everything happens on the default branch, commits go straight to it on GitHub.
describe("Git Sync — Complete Flow (Single Branch)", { retries: 0 }, () => {
  let ctx;
  let flow;
  const tagPrefixes = [];

  const editDraftsOnGitHubAndPull = () => {
    rewriteRepoFilesViaAPI(ctx.baseBranch, `modules/${flow.names.module}`, "alpha", "beta", "edit module on GitHub");
    rewriteRepoFilesViaAPI(
      ctx.baseBranch,
      `workflows/${flow.names.workflow}`,
      "/todos/2",
      "/todos/3",
      "edit workflow on GitHub",
    ).then((head) => {
      visitGitSyncPage(ctx, { branch: ctx.baseBranch });
      pullWorkspaceViaUI();
      waitForPullToFinish(ctx.baseBranch, head);
    });
    cy.reload();
  };

  before(() => {
    setupGitSyncSpec({ specKey: "flowsb", mode: "single" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
    const suffix = `${Date.now()}`;
    importCompleteFlowViaAPI(ctx.defaultBranch, suffix).then((imported) => {
      flow = imported;
      tagPrefixes.push(flow.coRel.module, flow.coRel.workflow);
      return pushCompleteFlowViaAPI(flow, ctx.defaultBranch, { singleBranch: true }).then(() =>
        waitForCommitMessageViaAPI(ctx.baseBranch, `feat: add ${flow.names.app}`),
      );
    });
  });

  after(() => {
    tagPrefixes.forEach((prefix) => deleteTagsByPrefixViaAPI(prefix));
    teardownGitSyncSpec();
  });

  it("should bring GitHub edits in with the header Pull and run every page with them", () => {
    editDraftsOnGitHubAndPull();

    visitGitSyncPage(ctx, { branch: ctx.baseBranch });
    cy.get(`[data-cy="${flow.names.folder}-list-card"]`, { timeout: 30000 }).click();
    cy.contains('[data-cy$="-card"]', flow.names.app, { timeout: 30000 }).should("be.visible");
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "modules" });
    cy.contains(flow.names.module, { timeout: 30000 }).should("be.visible");
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "workflows" });
    cy.contains(flow.names.workflow, { timeout: 30000 }).should("be.visible");
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "data-sources" });
    cy.contains(flow.names.dataSource, { timeout: 30000 }).should("be.visible");

    // The app follows the module's and workflow's latest content, so the GitHub edits show.
    openAppFromDashboardViaUI(ctx, ctx.baseBranch, flow.names.app);
    verifyPagesInEditor({ module: "beta", workflow: todoTitles[3] });
  });

  it("should keep the module and workflow pinned to v1 after GitHub edits, in the editor and the released app", () => {
    const pinMessage = `feat: pin ${flow.names.app} to v1`;

    openAppFromDashboardViaUI(ctx, ctx.baseBranch, flow.names.module, { page: "modules" });
    saveVersionViaUI("v1", { via: "versionMenu" });
    openAppFromDashboardViaUI(ctx, ctx.baseBranch, flow.names.workflow, { page: "workflows" });
    saveVersionViaUI("v1", { via: "versionMenu" });

    openAppFromDashboardViaUI(ctx, ctx.baseBranch, flow.names.app);
    openAppPage("module");
    pinModuleViewerVersionViaUI("moduleViewer1", "v1");
    pinWorkflowQueryVersionViaUI("runWf", "v1");
    commitAppViaUI(pinMessage);
    waitForCommitMessageViaAPI(ctx.baseBranch, pinMessage);
    saveVersionViaUI("v1", { via: "versionMenu" });
    getAppOnBranchViaAPI(flow.appId, ctx.defaultBranch.id).then((app) => tagPrefixes.push(app.co_relation_id));

    editDraftsOnGitHubAndPull();

    openAppFromDashboardViaUI(ctx, ctx.baseBranch, flow.names.app);
    verifyPagesInEditor();
    openAppPage("module");
    verifyModuleViewerVersion("moduleViewer1", "v1");
    verifyWorkflowQueryVersion("runWf", "v1");

    // Controls: the drafts did move to the GitHub edits, so the v1 values above come from the pins.
    verifyModuleDraftViaUI(ctx, ctx.baseBranch, flow.names.module, "beta", "alpha");
    verifyWorkflowDraftViaUI(ctx, ctx.baseBranch, flow.names.workflow, "getTodo2", todoTitles[3]);

    releaseSavedVersionViaAPI(flow.names.app, ctx.defaultBranch, "v1").then((slug) => verifyReleasedPages(slug));
  });
});
