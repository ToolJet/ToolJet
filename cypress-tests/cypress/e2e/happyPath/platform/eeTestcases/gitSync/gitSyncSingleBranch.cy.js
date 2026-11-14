import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { getBranchHeadViaAPI, getHeadCommitViaAPI } from "Support/utils/platform/gitSync/gitHubRepo";
import { listGitResources } from "Support/utils/platform/gitSync/gitRepoReader";
import { getVersionSyncStateViaDB } from "Support/utils/platform/gitSync/gitSyncDb";
import {
  createAppOnBranchViaAPI,
  getAppOnBranchViaAPI,
  loginToGitSyncSpec,
  pushAppViaAPI,
  setupGitSyncSpec,
  teardownGitSyncSpec,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { openBranchPopover, visitGitSyncPage } from "Support/utils/platform/gitSync/gitSyncUI";
import {
  listBranchesViaAPI,
  pullWorkspaceViaAPI,
} from "Support/utils/platform/gitSync/workspaceBranch";

describe("Git Sync — Single Branch Mode", () => {
  let ctx;

  beforeEach(() => {
    setupGitSyncSpec({ specKey: "single", mode: "single" }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  afterEach(() => {
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
    cy.get(GS.enableBranchingBtn).should("be.visible");
    cy.get(GS.wsCreateBranchBtn).should("not.exist");
  });

  it("should create an app on the default branch and commit it straight to GitHub", () => {
    const appName = `sb-direct-${Date.now()}`;
    const versionState = (appId, versionId) =>
      getVersionSyncStateViaDB({ appId }).then((rows) =>
        rows.find((r) => r.id === versionId),
      );
    createAppOnBranchViaAPI(appName, ctx.defaultBranch.id).then((created) =>
      getAppOnBranchViaAPI(created.id, ctx.defaultBranch.id).then((app) => {
        versionState(created.id, app.editing_version.id).then((v) => {
          expect(v, "default-branch version").to.exist;
          expect(v.isSynced, "unsynced before the first commit").to.equal(false);
        });
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
          versionState(created.id, app.editing_version.id).then((v) => {
            expect(v.isSynced, "synced after the commit").to.equal(true);
          });
          getBranchHeadViaAPI(ctx.baseBranch).then((head) =>
            pullWorkspaceViaAPI(ctx.defaultBranch).then(({ branch }) => {
              expect(branch.lastSyncedCommit, "lastSyncedCommit = GitHub head after pull").to.equal(head);
            }),
          );
        });
      }),
    );
  });
});
