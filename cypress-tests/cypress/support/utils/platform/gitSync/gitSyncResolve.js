import { gitSyncSelectors as GS } from "Selectors/platform/gitSyncSelectors";
import { gitSyncText } from "Texts/platform/gitSync";
import {
  setupGitSyncSpec,
  createAppOnBranchViaAPI,
  listAppsOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { configureGitSyncViaAPI } from "Support/utils/platform/gitSync/gitSyncSetup";

/**
 * Unsynced resources and pull-conflict resolution: apps authored before git sync
 * was connected, the dashboard "Push unsynced apps to git" modal, and the pull
 * conflict modal's "Sync from git remote" path.
 */

/**
 * Isolated spec workspace where `appNames` are created while git sync is OFF, then
 * GitHub is connected. A git-off app lands on the workspace's default branch with a
 * co_relation_id (server/src/modules/apps/service.ts:108-111, util.service.ts:419-422)
 * and is_synced=false; connecting keeps the same default-branch row and only renames it
 * (server/ee/git-sync/providers/github-https/util.service.ts:514-520).
 * Pair with `teardownGitSyncSpec()` in `after()`.
 *
 * @tjType gitSyncSpec.setupWithPreGitApps
 * @tjBlock gitSync
 * @tjUsage setupPreGitAppsSpec({ specKey: "unsynced", appNames: [a, b] }).then((c) => (ctx = c))
 * @tjDom none - workspace + POST /api/apps (git off) + git-sync config
 * @param {{specKey:string, appNames:string[], mode?:"single"|"multi"}} opts
 * @returns {Cypress.Chainable<{prefix, baseBranch, workspaceId, workspaceSlug, orgGitId, defaultBranch, preGitApps:Object<string,string>}>}
 *   preGitApps maps app name → app id
 */
export const setupPreGitAppsSpec = ({ specKey, appNames, mode = "multi" }) =>
  setupGitSyncSpec({ specKey, skipConfigure: true }).then((ctx) => {
    ctx.preGitApps = {};
    return cy
      .wrap(appNames, { log: false })
      .each((name) =>
        createAppOnBranchViaAPI(name).then((app) => {
          ctx.preGitApps[name] = app.id;
        }),
      )
      .then(() => configureGitSyncViaAPI({ branchName: ctx.baseBranch, mode }))
      .then(({ orgGitId, defaultBranch }) => {
        ctx.orgGitId = orgGitId;
        ctx.defaultBranch = defaultBranch;
        return ctx;
      });
  });

/**
 * The dashboard's per-app sync flag: true once the app's default-branch DRAFT
 * (version_type=version) has is_synced=true (server/src/modules/apps/util.service.ts
 * `stampIsAppSynced`). Drives the red unsynced icon (frontend/src/HomePage/AppCard.jsx:331).
 *
 * @tjType app.syncStateOnBranch
 * @tjBlock gitSync
 * @tjUsage getAppSyncStateViaAPI(appId, ctx.defaultBranch.id).then((s) => s.isAppSynced)
 * @tjDom none - GET /api/apps?branch_id=
 * @returns {Cypress.Chainable<{name:string, isAppSynced:boolean}|null>}
 */
export const getAppSyncStateViaAPI = (appId, branchId) =>
  listAppsOnBranchViaAPI(branchId).then((apps) => {
    const app = apps.find((a) => a.id === appId);
    return app ? { name: app.name, isAppSynced: !!(app.is_app_synced ?? app.isAppSynced) } : null;
  });

/**
 * Push an unsynced app from its dashboard card to a NEW branch through the
 * "Push unsynced apps to git" modal. Does not wait for the result — callers assert
 * the toast. The modal creates the branch off the default branch, pushes the app's
 * default-branch draft, pulls the new branch and switches to it
 * (frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:155-232).
 *
 * @tjType gitSyncUI.pushUnsyncedApp
 * @tjBlock gitSync
 * @tjUsage pushUnsyncedAppViaUI(appName, `${ctx.prefix}-push`)
 * @tjDom [data-cy="<app>-card"] hover → [data-cy="unsynced-badge"] → [data-cy="push-apps-branch-input"] → [data-cy="push-apps-create-branch"] → [data-cy="push-apps-submit"]
 */
export const pushUnsyncedAppViaUI = (appName, branchName) => {
  cy.get(GS.appCard(appName), { timeout: 30000 }).should("be.visible").realHover();
  cy.get(GS.appCard(appName)).find(GS.unsyncedBadge).should("be.visible").click();
  cy.get(GS.pushAppsModalTitle, { timeout: 30000 })
    .should("be.visible")
    .and("contain.text", gitSyncText.pushUnsyncedAppsTitle);
  cy.get(GS.pushAppsModal).should("contain.text", appName);
  cy.get(GS.pushAppsSubmit).should("be.disabled");
  cy.get(GS.pushAppsBranchInput).should("be.enabled").type(branchName);
  cy.get(GS.pushAppsCreateBranch).should("be.visible").and("contain.text", branchName).click();
  cy.get(GS.pushAppsBranchInput).should("have.value", branchName);
  cy.get(GS.pushAppsSubmit).should("be.enabled").click();
};

/**
 * In the open pull conflict modal, tick the syncable row for `appName` and press
 * "Sync selected". The modal then calls /workspace-branches/resolve-conflicts and
 * reloads the page (frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:293-309).
 *
 * @tjType gitSyncUI.syncConflictFromRemote
 * @tjBlock gitSync
 * @tjUsage syncAppConflictFromGitRemoteViaUI(appName)
 * @tjDom .conflict-row-header "App name - '<app>'" → .conflict-row-checkbox → [data-cy="conflict-sync-selected-button"]
 */
export const syncAppConflictFromGitRemoteViaUI = (appName) => {
  cy.get(GS.conflictSyncSelectedBtn)
    .should("contain.text", gitSyncText.syncSelected(0))
    .and("be.disabled");
  cy.contains(GS.conflictRowHeader, gitSyncText.conflictAppNameRow(appName))
    .find(GS.conflictRowCheckbox)
    .check();
  cy.get(GS.conflictSyncSelectedBtn)
    .should("contain.text", gitSyncText.syncSelected(1))
    .and("be.enabled")
    .click();
};
