import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  createAppOnBranchViaAPI,
  getAppOnBranchViaAPI,
  pushAppViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { listBranchesViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import { getHeadCommitViaAPI } from "Support/utils/platform/gitSync/gitHubRepo";
import { listGitResources } from "Support/utils/platform/gitSync/gitRepoReader";
import { visitGitSyncPage, openBranchPopover } from "Support/utils/platform/gitSync/gitSyncUI";

// Branching OFF: only the default branch exists, it is editable, and commits go straight to it
// (no feature branch, no PR). Rules: server/src/modules/git-sync-configs/guards/git-sync-edit-guard.ts,
// server/ee/workspace-branches/service.ts (list returns the default branch only).
describe("Git Sync — Single Branch Mode", { retries: 0 }, () => {
  let ctx;

  before(() => {
    setupGitSyncSpec({ specKey: "single", mode: "single" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should list only the default branch and offer Enable branching instead of branch creation", () => {
    listBranchesViaAPI().then(({ branches, isMultiBranchingEnabled, activeBranchId }) => {
      expect(isMultiBranchingEnabled, "single-branch mode").to.equal(false);
      expect(branches.map((b) => b.name), "default branch only").to.deep.equal([ctx.baseBranch]);
      expect(activeBranchId, "active branch is the default").to.equal(ctx.defaultBranch.id);
    });
    visitGitSyncPage(ctx, { branch: ctx.baseBranch, page: "data-sources" });
    cy.get(GS.lockedBanner).should("not.exist");
    cy.get(GS.wsPullButton).should("be.visible");
    cy.get(GS.wsCommitButton).should("be.visible");
    openBranchPopover();
    // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx (enable-branching-btn)
    cy.get(GS.enableBranchingBtn).should("be.visible");
    cy.get(GS.wsCreateBranchBtn).should("not.exist");
  });

  it("should create an app on the default branch and commit it straight to GitHub", () => {
    const appName = `sb-direct-${Date.now()}`;
    createAppOnBranchViaAPI(appName, ctx.defaultBranch.id).then((created) =>
      getAppOnBranchViaAPI(created.id, ctx.defaultBranch.id).then((app) =>
        pushAppViaAPI({
          appId: created.id,
          versionId: app.editing_version.id,
          appName,
          branch: ctx.defaultBranch,
          singleBranch: true,
          commitMessage: `feat: commit ${appName} to default`,
        }).then(() => {
          getHeadCommitViaAPI(ctx.baseBranch).then((head) => {
            expect(head.message, "commit landed on the default branch, no PR").to.include(appName);
          });
          listGitResources(ctx.baseBranch).then(({ apps }) => {
            expect(apps, "app folder on the default branch").to.include(appName);
          });
        }),
      ),
    );
  });
});
