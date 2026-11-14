import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { gitSyncText } from "Texts/platform/gitSync";
import {
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  getAppOnBranchViaAPI,
  listAppsOnBranchViaAPI,
  seedPushedAppViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import {
  createBranchViaAPI,
  getBranchViaAPI,
  waitForPullToFinish,
} from "Support/utils/platform/gitSync/workspaceBranch";
import {
  getBranchHeadViaAPI,
  mergeBranchViaAPI,
  readRepoJsonViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { visitGitSyncPage, pullWorkspaceViaUI } from "Support/utils/platform/gitSync/gitSyncUI";
import {
  setupPreGitAppsSpec,
  getAppSyncStateViaAPI,
  syncAppConflictFromGitRemoteViaUI,
} from "Support/utils/platform/gitSync/gitSyncResolve";

// The local app is created before git is connected, since the multi-branch default branch rejects app creation.
describe("Git Sync — Pull Name Conflict", { retries: 0 }, () => {
  const appName = `conflict-app-${Date.now()}`;
  let ctx;

  before(() => {
    setupPreGitAppsSpec({ specKey: "conflict", appNames: [appName] }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should resolve a same-name pull conflict with Sync from git remote and adopt the git app identity", () => {
    const localAppId = ctx.preGitApps[appName];
    const appJsonPath = `apps/${appName}/app/app.json`;

    getAppOnBranchViaAPI(localAppId, ctx.defaultBranch.id).then((localApp) => {
      const localCoRelationId = localApp.co_relation_id;
      expect(localCoRelationId, "local app has a co_relation_id").to.be.a("string");

      createBranchViaAPI(`${ctx.prefix}-seed`)
        .then((branch) =>
          seedPushedAppViaAPI({ branch, appName }).then(() =>
            mergeBranchViaAPI(branch.name, ctx.baseBranch),
          ),
        )
        .then(() => readRepoJsonViaAPI(ctx.baseBranch, appJsonPath))
        .then((appJson) => {
          expect(appJson, `${appJsonPath} on ${ctx.baseBranch}`).to.not.equal(null);
          const gitCoRelationId = appJson.id;
          expect(gitCoRelationId, "git identity differs from the local app").to.not.equal(
            localCoRelationId,
          );

          getBranchViaAPI(ctx.baseBranch).then((branch) => {
            const syncedBefore = branch.lastSyncedCommit;

            visitGitSyncPage(ctx, { branch: ctx.baseBranch });
            pullWorkspaceViaUI();

            cy.get(GS.pullConflictModal, { timeout: 60000 }).should("be.visible");
            cy.get(GS.conflictTitle).should("have.text", gitSyncText.pullConflictTitle);
            cy.contains(GS.conflictCategoryTitle, gitSyncText.syncFromGitRemoteCategory).should(
              "be.visible",
            );
            cy.contains(GS.conflictRowHeader, gitSyncText.conflictAppNameRow(appName)).should(
              "be.visible",
            );
            // The first syncable row opens expanded; items show the first 8 chars of each co_relation_id.
            cy.contains(GS.conflictItem, `#${gitCoRelationId.slice(0, 8)}`).should(
              "contain.text",
              gitSyncText.conflictRemoteBadge,
            );
            cy.contains(GS.conflictItem, `#${localCoRelationId.slice(0, 8)}`).should(
              "contain.text",
              gitSyncText.conflictLocalBadge,
            );
            // A conflicting pull is rejected before the job is queued.
            getBranchViaAPI(ctx.baseBranch).then((b) => {
              expect(b.lastSyncedCommit, "conflicting pull did not run").to.equal(syncedBefore);
            });

            syncAppConflictFromGitRemoteViaUI(appName);
            cy.contains(gitSyncText.conflictSyncedToast, { timeout: 30000 }).should("be.visible");
            cy.get(GS.pullConflictModal).should("not.exist");

            getAppOnBranchViaAPI(localAppId, ctx.defaultBranch.id).then((app) => {
              expect(app.co_relation_id, "local app adopted the git co_relation_id").to.equal(
                gitCoRelationId,
              );
            });

            getBranchHeadViaAPI(ctx.baseBranch).then((remoteHead) => {
              visitGitSyncPage(ctx, { branch: ctx.baseBranch });
              pullWorkspaceViaUI();
              cy.contains(gitSyncText.workspacePullStarted).should("be.visible");
              cy.get(GS.pullConflictModal).should("not.exist");
              waitForPullToFinish(ctx.baseBranch, remoteHead);
              cy.reload();

              listAppsOnBranchViaAPI(ctx.defaultBranch.id).then((apps) => {
                const sameName = apps.filter((a) => a.name === appName);
                expect(sameName, "one app with that name on the default branch").to.have.length(1);
                expect(sameName[0].id, "the local app was relinked, not duplicated").to.equal(
                  localAppId,
                );
              });
              getAppSyncStateViaAPI(localAppId, ctx.defaultBranch.id).then((state) => {
                expect(state.isAppSynced, "relinked app is synced").to.equal(true);
              });
              cy.get(GS.appCard(appName), { timeout: 30000 }).should("have.length", 1);
              cy.get(GS.appCard(appName)).find(GS.unsyncedBadgeIdle).should("not.exist");
            });
          });
        });
    });
  });
});
