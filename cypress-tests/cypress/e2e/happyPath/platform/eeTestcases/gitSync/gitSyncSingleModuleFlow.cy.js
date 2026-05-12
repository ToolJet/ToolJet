import { commonWidgetSelector } from "Selectors/common";
import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

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
  { retries: 0 },
  () => {
    const testId = Date.now();
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow3-${testId}`;
    const moduleName = `mod-flow3-${testId}`;
    const widgetTextValue = `flow3-marker-${testId}`;

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

    it("Build module on Dev → push → merge → pull on Prod → verify module renders on Prod", () => {
      // ── DEV: build a module containing one Text widget on a feature branch ──
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        // Activate the branch so subsequent UI dashboard ops + content writes
        // land on the feature branch (not master).
        cy.apiSwitchBranch(branchId);

        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.visit(`/${devIdRef.value}/apps/${module.id}`);
          cy.waitForAppLoad();
          cy.skipEditorPopover();

          cy.dragAndDropWidget("Text", 200, 200);

          // Set the text to a unique marker so we can prove on Prod that the
          // module wasn't just created with a placeholder — the actual content
          // round-tripped through git.
          cy.openEditorSidebar("text1");
          cy.get('[data-cy="textcomponenttextinput-input-field"]')
            .clearAndTypeOnCodeMirror(widgetTextValue);
          cy.forceClickOnCanvas();
          cy.waitForAutoSave();
        });
      });

      // ── DEV: commit + push the branch ──
      cy.gitSyncDashboardPush(`test: add module ${moduleName}`);

      // ── GitHub: open the PR via REST and merge it into master ──
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(
        branchName,
        `test: add module ${moduleName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));

      // ── PROD: pull master and verify the module + its widget content ──
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();

      cy.visit(`/${prodWsName}/modules`);
      cy.contains('[data-cy$="-card"]', moduleName, { timeout: 30000 }).should(
        "be.visible",
      );

      cy.gitSyncOpenAppInBuilder(moduleName);
      cy.get(commonWidgetSelector.draggableWidget("text1"), { timeout: 30000 })
        .should("be.visible")
        .and("contain.text", widgetTextValue);
    });
  },
);
