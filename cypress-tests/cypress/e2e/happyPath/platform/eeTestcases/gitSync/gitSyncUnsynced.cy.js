import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { gitSyncText } from "Texts/platform/gitSync";
import {
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  getAppOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { pullWorkspaceViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import {
  mergeBranchViaAPI,
  readRepoJsonViaAPI,
  waitForCommitMessageViaAPI,
} from "Support/utils/platform/gitSync/gitHubRepo";
import { visitGitSyncPage, openAppFromDashboardViaUI } from "Support/utils/platform/gitSync/gitSyncUI";
import {
  setupPreGitAppsSpec,
  getAppSyncStateViaAPI,
  pushUnsyncedAppViaUI,
} from "Support/utils/platform/gitSync/gitSyncResolve";

// Pre-git apps stay unsynced until pushed, merged and pulled back; the push alone doesn't sync them.
describe("Git Sync — Unsynced Apps", { retries: 0 }, () => {
  const runId = Date.now();
  const editableApp = `unsynced-edit-${runId}`;
  const pushedApp = `unsynced-push-${runId}`;
  let ctx;

  before(() => {
    setupPreGitAppsSpec({ specKey: "unsynced", appNames: [editableApp, pushedApp] }).then((c) => {
      ctx = c;
    });
  });

  beforeEach(() => {
    loginToGitSyncSpec(ctx);
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should show the unsynced indicator on a pre-git app and keep it editable on the default branch", () => {
    const appId = ctx.preGitApps[editableApp];
    getAppSyncStateViaAPI(appId, ctx.defaultBranch.id).then((state) => {
      expect(state, "pre-git app listed on the default branch").to.not.equal(null);
      expect(state.isAppSynced, "pre-git app is unsynced").to.equal(false);
    });
    // source: server/src/modules/apps/util.service.ts:1678-1688 (unsynced drafts are exempt from the default-branch lock)
    getAppOnBranchViaAPI(appId, ctx.defaultBranch.id).then((app) => {
      expect(app.should_freeze_editor, "editor not frozen for an unsynced app").to.equal(false);
    });

    visitGitSyncPage(ctx, { branch: ctx.baseBranch });
    cy.get(GS.appCard(editableApp), { timeout: 30000 })
      .find(GS.unsyncedBadgeIdle)
      .should("be.visible");

    openAppFromDashboardViaUI(ctx, ctx.baseBranch, editableApp);
    cy.get(GS.lifecycleCta).should("contain.text", gitSyncText.lifecycleSync);
    cy.get(GS.versionLockBanner).should("not.exist");
    cy.get(GS.lockedBanner).should("not.exist");
  });

  it("should push an unsynced app to a new branch from the dashboard and clear the indicator after merge and pull", () => {
    const appId = ctx.preGitApps[pushedApp];
    const pushBranch = `${ctx.prefix}-push`;
    const appJsonPath = `apps/${pushedApp}/app/app.json`;

    getAppOnBranchViaAPI(appId, ctx.defaultBranch.id).then((app) => {
      const coRelationId = app.co_relation_id;
      expect(coRelationId, "pre-git app has a co_relation_id").to.be.a("string");

      visitGitSyncPage(ctx, { branch: ctx.baseBranch });
      pushUnsyncedAppViaUI(pushedApp, pushBranch);
      cy.contains(gitSyncText.pushUnsyncedSuccess(ctx.baseBranch), { timeout: 120000 }).should(
        "be.visible",
      );
      waitForCommitMessageViaAPI(pushBranch, gitSyncText.pushUnsyncedCommitMessage(pushedApp));
      readRepoJsonViaAPI(pushBranch, appJsonPath).then((appJson) => {
        expect(appJson, `${appJsonPath} on ${pushBranch}`).to.not.equal(null);
        expect(appJson.id, "app.json id is the app's co_relation_id").to.equal(coRelationId);
      });

      // Pushed but not merged: the default-branch draft is still unsynced.
      getAppSyncStateViaAPI(appId, ctx.defaultBranch.id).then((state) => {
        expect(state.isAppSynced, "still unsynced before merge + pull").to.equal(false);
      });
      visitGitSyncPage(ctx, { branch: ctx.baseBranch });
      cy.get(GS.appCard(pushedApp), { timeout: 30000 })
        .find(GS.unsyncedBadgeIdle)
        .should("be.visible");

      mergeBranchViaAPI(pushBranch, ctx.baseBranch);
      pullWorkspaceViaAPI(ctx.defaultBranch);

      readRepoJsonViaAPI(ctx.baseBranch, appJsonPath).then((appJson) => {
        expect(appJson, `${appJsonPath} on ${ctx.baseBranch}`).to.not.equal(null);
        expect(appJson.id, "merged app.json id").to.equal(coRelationId);
      });
      getAppSyncStateViaAPI(appId, ctx.defaultBranch.id).then((state) => {
        expect(state.isAppSynced, "synced on the default branch after merge + pull").to.equal(true);
      });
      // A synced draft on the multi-branch default branch is locked like any other synced app.
      getAppOnBranchViaAPI(appId, ctx.defaultBranch.id).then((app) => {
        expect(app.co_relation_id, "same app identity after pull").to.equal(coRelationId);
        expect(app.should_freeze_editor, "default branch locks the now-synced app").to.equal(true);
      });

      visitGitSyncPage(ctx, { branch: ctx.baseBranch });
      cy.get(GS.appCard(pushedApp), { timeout: 30000 }).should("be.visible");
      cy.get(GS.appCard(pushedApp)).find(GS.unsyncedBadgeIdle).should("not.exist");
      cy.get(GS.appCard(pushedApp)).find(GS.unsyncedBadge).should("not.exist");
    });
  });
});
