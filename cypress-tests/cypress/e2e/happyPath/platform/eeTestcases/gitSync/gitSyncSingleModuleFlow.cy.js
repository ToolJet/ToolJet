import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Flow #3 from the dev→prod user-flows gist:
//   "Add module → commit → push → PR → merge → pull on Prod → testable on Prod"
//
// Dev creates a module on a feature branch and pushes via REST; the PR gets
// merged into master; Prod pulls master and we verify the module reads
// correctly on locked main (ModuleContainer renders, locked-branch-banner
// visible, .query-details disabled).
//
// Authoring is REST-only — see commit 9dd27b7ddd for the design rationale
// (Chrome renderer crashed on editor → dashboard transitions in headless,
// and the dashboard push UI alone doesn't pick up API-created modules).
// Skip cleanup for debugging by setting CYPRESS_NO_CLEANUP=1.
describe(
  "Git Sync — Flow #3: Single Module (Dev → Prod)",
  // One retry covers two transient-failure classes: the original Chrome
  // renderer crash (now mostly addressed by browserConfig.js flags) AND
  // 30s timeouts on /api/app-git/gitpush when GitHub's API is slow.
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

      // ── DEV — feature branch + module + REST push ─────────────────────
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });
      cy.gitSyncCreateBranchViaApi(branchName);
      // UI branch switch must precede any editor-side work: apiSwitchBranch
      // flips a server flag but the SPA's branch store reads on bootstrap.
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(branchName);
      cy.screenshot("01-after-ui-switch-branch", { capture: "viewport" });

      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.apiGetEditingVersionId(module.id, branchId).then((versionId) => {
            cy.apiEditorPush(
              module.id,
              versionId,
              `test: add module ${moduleName}`,
              branchName,
              moduleName,
            );
            cy.gitHubWaitForCommitMessage(branchName, moduleName);
            cy.apiGitSyncPush(`test: dashboard push ${moduleName}`, branchId);
          });
          cy.screenshot("02-after-push", { capture: "viewport" });
        });
      });

      // ── GitHub ── PR + merge ──────────────────────────────────────────
      gitSyncDualWs.mergePr({
        branchName,
        message: `test: add module ${moduleName}`,
      });
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull, find module card, open + verify locked state ────
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      cy.screenshot("04-after-switch-to-prod", { capture: "viewport" });
      gitSyncDualWs.pullMaster();
      cy.screenshot("05-after-pull-master", { capture: "viewport" });

      cy.visit(`/${prodIdRef.value}/modules`);
      cy.contains('[data-cy$="-card"]', moduleName, { timeout: 60000 }).should(
        "be.visible",
      );
      cy.screenshot("06-module-card-found", { capture: "viewport" });

      cy.gitSyncOpenAppInBuilder(moduleName);
      cy.skipEditorPopover();
      cy.screenshot("07-prod-module-builder-open", { capture: "viewport" });

      // Locked-master read state. Promote/release intentionally not
      // exercised — the env-tag dropdown on a locked-master module does
      // not expose `promote-version-button` (lives in Flow #11's leg-c,
      // deferred).
      cy.get('[component-type="ModuleContainer"]', { timeout: 20000 }).should(
        "be.visible",
      );
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(".query-details").should("have.class", "disabled");
      cy.screenshot("08-prod-module-readonly-verified", {
        capture: "viewport",
      });
    });
  },
);
