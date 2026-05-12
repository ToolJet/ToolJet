import { commonWidgetSelector } from "Selectors/common";
import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #9 from the dev→prod user-flows gist:
//   "Build app embedding module-with-DS → commit → push → PR → merge → pull on
//    Prod → test → promote → release. Private app: access controlled by user
//    groups."
//
// Composite of #7 (module + DS) plus an outer app that embeds the module, plus
// a release step on Prod.
//
// DRAFT — depends on #3 + #7 passing. TODOs flag unknowns.
describe(
  "Git Sync — Flow #9: App embedding Module-with-DS (Dev → Prod → release)",
  { retries: 0 },
  () => {
    const testId = Date.now();
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow9-${testId}`;
    const moduleName = `mod-flow9-${testId}`;
    const appName = `app-flow9-${testId}`;
    const dsName = `restApi-${testId}`;

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

    it("Build app+module+DS on Dev → push → merge → pull on Prod → release on Prod", () => {
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiSwitchBranch(branchId);

        // 1. Build the module with a query against `dsName`.
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.visit(`/${devIdRef.value}/apps/${module.id}`);
          cy.waitForAppLoad();
          cy.skipEditorPopover();
          // TODO (from #7): drop button + text, add query to button onClick,
          //                 bind text to query response.
          cy.waitForAutoSave();
        });

        // 2. Build an app on the same branch and embed the module.
        cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
          cy.visit(`/${devIdRef.value}/apps/${app.id}`);
          cy.waitForAppLoad();
          cy.skipEditorPopover();
          // TODO: drop the "Module" widget on the app canvas + select `moduleName`
          //       in its picker. Need to scout: data-cy of the Module widget +
          //       the embedded module's picker dropdown.
          cy.waitForAutoSave();
        });
      });

      cy.gitSyncDashboardPush(`test: add app+module+ds ${appName}`);
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(
        branchName,
        `test: add app+module+ds ${appName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));

      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();

      // App + module both reach Prod.
      cy.visit(`/${prodWsName}/`);
      cy.contains('[data-cy$="-card"]', appName, { timeout: 30000 }).should(
        "be.visible",
      );
      cy.visit(`/${prodWsName}/modules`);
      cy.contains('[data-cy$="-card"]', moduleName, { timeout: 30000 }).should(
        "be.visible",
      );

      // TODO: open the app on Prod, release it (multiEnv.releaseApp helper),
      //       launch the released version, click the embedded module's button,
      //       assert the text widget shows a value unique to prodDsUrl.
      cy.gitSyncOpenAppInBuilder(appName);
      cy.get(commonWidgetSelector.draggableWidget("modulecontainer1"), {
        timeout: 30000,
      }).should("be.visible");
    });
  },
);
