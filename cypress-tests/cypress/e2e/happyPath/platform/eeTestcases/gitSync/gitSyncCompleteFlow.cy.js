import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  importCompleteFlowViaAPI,
  pushCompleteFlowViaAPI,
  getAppOnBranchViaAPI,
  releaseSavedVersionViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  createBranchViaAPI,
  pullWorkspaceViaAPI,
  waitForPullToFinish,
} from "Support/utils/platform/gitSync/workspaceBranch";
import {
  getBranchHeadViaAPI,
  mergeBranchViaAPI,
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

describe("Git Sync — Complete Flow (Multi Branch)", { retries: 0 }, () => {
  let ctx;
  let flow;
  const tagPrefixes = [];

  before(() => {
    setupGitSyncSpec({ specKey: "flow", mode: "multi" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
    const suffix = `${Date.now()}`;
    createBranchViaAPI(`${ctx.prefix}-${suffix}`).then((branch) =>
      importCompleteFlowViaAPI(branch, suffix).then((imported) => {
        flow = { ...imported, branch };
        tagPrefixes.push(flow.coRel.module, flow.coRel.workflow);
        return pushCompleteFlowViaAPI(flow, branch).then(() => mergeBranchViaAPI(branch.name, ctx.baseBranch));
      }),
    );
  });

  after(() => {
    tagPrefixes.forEach((prefix) => deleteTagsByPrefixViaAPI(prefix));
    teardownGitSyncSpec();
  });

  it("should pull the app, module, workflow and data source onto default and run every page", () => {
    getBranchHeadViaAPI(ctx.baseBranch).then((mergedHead) => {
      visitGitSyncPage(ctx, { branch: ctx.baseBranch });
      pullWorkspaceViaUI();
      waitForPullToFinish(ctx.baseBranch, mergedHead);
    });
    cy.reload();

    cy.get(`[data-cy="${flow.names.folder}-list-card"]`, { timeout: 30000 }).click();
    cy.contains('[data-cy$="-card"]', flow.names.app, { timeout: 30000 }).should("be.visible");

    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "modules" });
    cy.contains(flow.names.module, { timeout: 30000 }).should("be.visible");
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "workflows" });
    cy.contains(flow.names.workflow, { timeout: 30000 }).should("be.visible");
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "data-sources" });
    cy.contains(flow.names.dataSource, { timeout: 30000 }).should("be.visible");

    openAppFromDashboardViaUI(ctx, ctx.baseBranch, flow.names.app);
    cy.get(GS.lifecycleCta).should("contain.text", "Pull commit");
    verifyPagesInEditor();
  });

  it("should keep the module and workflow pinned to v1 after their drafts change on default, in the editor and the released app", () => {
    const pinMessage = `feat: pin ${flow.names.app} to v1`;

    pullWorkspaceViaAPI(ctx.defaultBranch);
    createBranchViaAPI(`${ctx.prefix}-pin-${Date.now()}`).then((pin) => {
      // Saving a version tags it on GitHub and locks that module/workflow on this branch.
      openAppFromDashboardViaUI(ctx, pin.name, flow.names.module, { page: "modules" });
      saveVersionViaUI("v1");
      openAppFromDashboardViaUI(ctx, pin.name, flow.names.workflow, { page: "workflows" });
      saveVersionViaUI("v1");
      waitForTagViaAPI(`${flow.coRel.module}/v1`);
      waitForTagViaAPI(`${flow.coRel.workflow}/v1`);

      openAppFromDashboardViaUI(ctx, pin.name, flow.names.app);
      openAppPage("module");
      pinModuleViewerVersionViaUI("moduleViewer1", "v1");
      pinWorkflowQueryVersionViaUI("runWf", "v1");
      commitAppViaUI(pinMessage);
      waitForCommitMessageViaAPI(pin.name, pinMessage);

      // The app's own v1 is what gets released on default.
      saveVersionViaUI("v1");
      getAppOnBranchViaAPI(flow.appId, pin.id).then((app) => {
        tagPrefixes.push(app.co_relation_id);
        waitForTagViaAPI(`${app.co_relation_id}/v1`);
      });
      mergeBranchViaAPI(pin.name, ctx.baseBranch);
    });

    // The drafts on default move past v1: edit the module and workflow files on GitHub.
    rewriteRepoFilesViaAPI(ctx.baseBranch, `modules/${flow.names.module}`, "alpha", "beta", "edit module draft");
    rewriteRepoFilesViaAPI(
      ctx.baseBranch,
      `workflows/${flow.names.workflow}`,
      "/todos/2",
      "/todos/3",
      "edit workflow draft",
    ).then((head) => {
      visitGitSyncPage(ctx, { branch: ctx.baseBranch });
      pullWorkspaceViaUI();
      waitForPullToFinish(ctx.baseBranch, head);
    });
    cy.reload();

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
