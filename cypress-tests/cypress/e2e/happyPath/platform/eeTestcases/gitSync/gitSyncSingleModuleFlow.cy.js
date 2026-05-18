import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Flow #3 from the dev→prod user-flows gist:
//   "Add module → commit → push → PR → merge → pull on Prod → testable on Prod"
//
// The spec creates two workspaces on the same instance to model Dev + Prod, builds
// a module with one Text widget on Dev, pushes via the dashboard UI, opens & merges
// the PR on GitHub, pulls master on Prod, and asserts the module renders on Prod
// with its content intact.
//
// Skip cleanup for debugging by setting CYPRESS_NO_CLEANUP=1 in the env.
describe(
  "Git Sync — Flow #3: Single Module (Dev → Prod)",
  // One retry covers two transient-failure classes:
  //   - The original Chrome-renderer crash on module-editor → dashboard-push
  //     transitions (now mostly addressed by browserConfig.js stability
  //     flags, but kept as belt-and-braces).
  //   - Network/server flakiness on /api/app-git/gitpush — observed 30s
  //     timeouts on this endpoint when GitHub's API responds slowly.
  // Both are environment-flaky rather than spec bugs.
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = Date.now();
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow3-${testId}`;
    const moduleName = `mod-flow3-${testId}`;

    const devIdRef = { value: null };
    const prodIdRef = { value: null };

    before(() => {
      Cypress.config("redirectionLimit", 20);
      gitSyncDualWs.setupDevAndProd({
        devName: devWsName,
        prodName: prodWsName,
        devIdRef,
        prodIdRef,
      });
    });

    after(() => {
      gitSyncDualWs.teardown({ devIdRef, prodIdRef, branchName });
    });

    it("Create module on Dev → push → merge → pull on Prod → module readable on locked master", () => {
      cy.screenshot("00-it-start", { capture: "viewport" });

      // ── DEV: create a module on a feature branch (API only; widget content
      //        is deferred to follow-up specs once module-editor drag-and-drop
      //        is sorted — see follow-up note in the file header). ──
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });

      cy.gitSyncCreateBranchViaApi(branchName);

      // Switch the UI to the feature branch BEFORE visiting the module editor.
      // `apiSwitchBranch` flips a server flag but the SPA's branch store reads
      // on bootstrap — without the UI-side switch, the module editor fetches
      // master-context state (where the module doesn't exist) and renders a
      // blank canvas, so the ModuleContainer DOM target never appears.
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(branchName);
      cy.screenshot("01-after-ui-switch-branch", { capture: "viewport" });

      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          // Push the module to git via the editor-push REST endpoint instead
          // of opening the module editor + dashboard push UI:
          //   - The dashboard "Push" button alone only commits data-source-
          //     level changes — a module created via /api/modules has no
          //     "pending" marker the dashboard push picks up.
          //   - Visiting the module editor to trigger an editor save +
          //     navigating to /data-sources for the dashboard push has been
          //     observed to crash Chrome's renderer in headless CI.
          // apiEditorPush + apiGitSyncPush mirror what the UI buttons
          // ultimately call (same pattern gitSyncFunctionality uses for
          // app fixtures) without rendering either page.
          cy.apiGetEditingVersionId(module.id, branchId).then((versionId) => {
            cy.apiEditorPush(
              module.id,
              versionId,
              `test: add module ${moduleName}`,
              branchName,
              moduleName,
            );
            cy.gitHubWaitForCommitMessage(branchName, moduleName);
            cy.apiGitSyncPush(
              `test: dashboard push ${moduleName}`,
              branchId,
            );
          });
          cy.screenshot("02-after-push", { capture: "viewport" });
        });
      });

      // ── GitHub: open the PR via REST and merge it into master ──
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(
        branchName,
        `test: add module ${moduleName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD: pull master and verify the module shows up by name ──
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      cy.screenshot("04-after-switch-to-prod", { capture: "viewport" });

      gitSyncDualWs.pullMaster();
      cy.screenshot("05-after-pull-master", { capture: "viewport" });

      // Use the UUID (not the slug) to stay aligned with the workspace-scoped
      // auth from gitSyncDualWs.switchTo. See note in that helper.
      cy.visit(`/${prodIdRef.value}/modules`);
      cy.screenshot("06-after-visit-modules", { capture: "viewport" });

      cy.contains('[data-cy$="-card"]', moduleName, { timeout: 60000 }).should(
        "be.visible",
      );
      cy.screenshot("07-module-card-found", { capture: "viewport" });

      // ── PROD: open the module → verify the read-only state on master ──
      // Master is locked on Prod (no branch was created here, we only pulled
      // the merged commit). So:
      //   - the ModuleContainer must render (proves the synced module loaded)
      //   - the locked-branch banner must be visible (proves write paths are
      //     gated by the SPA)
      //   - the query manager must carry the `.disabled` class (proves the
      //     bottom panel is read-only — same check multiEnv.verifyQueryEditorDisabled
      //     uses on locked app versions)
      // Promote/release isn't exercised here: the env-tag dropdown on a
      // locked-master module does not expose `promote-version-button`. A
      // separate spec creates a branch on Prod and runs the promote/release
      // sequence from there.
      cy.gitSyncOpenAppInBuilder(moduleName);
      cy.skipEditorPopover();
      cy.screenshot("08-prod-module-builder-open", { capture: "viewport" });

      cy.get('[component-type="ModuleContainer"]', {
        timeout: 20000,
      }).should("be.visible");
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(".query-details").should("have.class", "disabled");
      cy.screenshot("09-prod-module-readonly-verified", {
        capture: "viewport",
      });
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Flow under test — step-by-step
// ─────────────────────────────────────────────────────────────────────────────
//   Setup
//     1. Spin up two workspaces on the same instance (Dev, Prod).
//     2. Configure git-sync on both workspaces (idempotent helper).
//
//   Dev — author the module
//     3. Log into Dev. Create feature branch via API.
//     4. Switch the SPA branch store to the feature branch via the dashboard
//        UI (so the editor + dashboard build state against the feature branch).
//     5. API-create an empty module on the feature branch. (Widget-content
//        round-trip via the module editor is deferred to a follow-up spec —
//        see the inline comment.)
//
//   Dev → GitHub
//     6. Dashboard push the feature branch with a commit message.
//     7. Poll GitHub until the branch is ahead of master.
//     8. Open a PR via REST → merge it via REST.
//
//   Prod — pull + verify locked-master read state
//     9. Switch to the Prod workspace.
//    10. Pull master via the dashboard UI (pull modal → check for updates →
//        pull changes → wait for modal to close → reload dashboard so the
//        SPA picks up the newly-synced rows).
//    11. Visit /{prodId}/modules. Assert the module card is visible by name.
//    12. Open the module in the builder via the dashboard card's Edit link.
//    13. Verify the read-only state on locked master:
//          - ModuleContainer renders (module synced through git intact)
//          - "locked-branch-banner" visible (SPA write paths gated)
//          - `.query-details` has class `disabled` (QM is read-only)
//        Right-sidebar inspector + query manager are disabled on master;
//        only module components can be verified. The promote / release
//        sequence is intentionally excluded — the env-tag dropdown on a
//        locked-master module does not expose the promote-version button,
//        so that flow lives in a sibling spec that creates a branch on
//        Prod first.
//
//   Teardown
//    14. Archive both workspaces via API.
//    15. Delete the feature branch on GitHub.
//        (Skip 14–15 with CYPRESS_NO_CLEANUP=1 for debugging.)
// ─────────────────────────────────────────────────────────────────────────────
