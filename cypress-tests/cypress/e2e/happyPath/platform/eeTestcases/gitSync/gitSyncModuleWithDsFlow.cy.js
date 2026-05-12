import { commonWidgetSelector } from "Selectors/common";
import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #7 from the dev→prod user-flows gist:
//   "Build module with DS connection → commit → push → PR → merge → pull on Prod
//    → testable on Prod (Prod credentials)"
//
// Same name DS on both workspaces, different URL — proves the per-instance creds
// rule: app/module JSON in git references the DS by name, the credentials are
// resolved locally on each instance.
//
// DRAFT — depends on #3 passing first. TODOs flag unknowns to fill in.
describe(
  "Git Sync — Flow #7: Module with DS connection (Dev → Prod)",
  { retries: 0 },
  () => {
    const testId = Date.now();
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow7-${testId}`;
    const moduleName = `mod-flow7-${testId}`;
    const dsName = `restApi-${testId}`;
    const queryName = `q-${testId}`;

    // Same DS name, different URLs to prove the per-instance creds rule.
    const devDsUrl = "https://jsonplaceholder.typicode.com";
    const prodDsUrl = "https://reqres.in";

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

      // Create a global REST DS with the same name on both instances, different URL.
      // TODO: confirm `apiCreateDataSource` URL signature for global rest API DS
      //       (current usage in marketplace specs may differ from what we want here).
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });
      cy.apiCreateDataSource(
        `${Cypress.env("server_host")}/api/v2/data_sources`,
        dsName,
        "restapi",
        { url: devDsUrl, headers: [["", ""]] },
      );

      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      cy.apiCreateDataSource(
        `${Cypress.env("server_host")}/api/v2/data_sources`,
        dsName,
        "restapi",
        { url: prodDsUrl, headers: [["", ""]] },
      );
    });

    after(() => {
      gitSyncDualWs.teardown({ devIdRef, prodIdRef, branchName });
    });

    it("Build module-with-DS on Dev → push → merge → pull on Prod → query resolves to Prod DS", () => {
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiSwitchBranch(branchId);

        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.visit(`/${devIdRef.value}/apps/${module.id}`);
          cy.waitForAppLoad();
          cy.skipEditorPopover();

          // Drop a Button and a Text widget so the query can be triggered + the
          // result rendered for assertion on Prod.
          cy.dragAndDropWidget("Button", 200, 200);
          cy.dragAndDropWidget("Text", 200, 300);

          // TODO: add a query against `dsName` via the editor query panel UI.
          // Add the query to the button's onClick and bind the text to its result.
          // Need to scout: query panel data-cy on the module editor (likely
          // identical to app editor — confirm).

          cy.waitForAutoSave();
        });
      });

      cy.gitSyncDashboardPush(`test: add module-with-ds ${moduleName}`);
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(
        branchName,
        `test: add module-with-ds ${moduleName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));

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

      // TODO: trigger the query (click button) and assert the response came from
      // PROD DS URL — e.g., reqres.in returns "page" key, jsonplaceholder doesn't.
      // Pick a property unique to prodDsUrl and assert the Text widget shows it.
      cy.get(commonWidgetSelector.draggableWidget("button1")).should(
        "be.visible",
      );
    });
  },
);
