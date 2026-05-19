import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #9 from the dev→prod user-flows gist:
//   "Build app embedding module-with-DS → commit → push → PR → merge → pull on
//    Prod → test → promote → release."
//
// Composite of #7 (module + DS-bound query) plus an outer app that embeds the
// module via a ModuleViewer widget. Push BOTH the module and the app on the
// same feature branch, merge the PR, and verify on Prod that:
//   - the module card is on /modules
//   - the app card is on /
//   - the app opens with its embedded ModuleViewer mounted
//   - .query-details is disabled (locked-master read state)
//
// Per-step API plumbing lives in gitSyncDualWs.* helpers. Promote + release
// are intentionally NOT exercised — same blocker that capped Flow #3.
describe(
  "Git Sync — Flow #9: App embedding Module-with-DS (Dev → Prod)",
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow9-${testId}`;
    const moduleName = `mod-flow9-${testId}`;
    const appName = `app-flow9-${testId}`;
    const dsName = `restapi-${testId}`;
    const queryName = `q-${testId}`;

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
      gitSyncDualWs.createSameNameDsOnBoth({
        dsName,
        devUrl: devDsUrl,
        prodUrl: prodDsUrl,
        devIdRef,
        prodIdRef,
        devWsName,
        prodWsName,
      });
    });

    after(() => {
      gitSyncDualWs.teardown({ devIdRef, prodIdRef, branchName });
    });

    it("Build app+module+DS on Dev → push → merge → pull on Prod → app embeds the module", () => {
      cy.screenshot("00-it-start", { capture: "viewport" });

      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(branchName);
      cy.screenshot("01-after-ui-switch-branch", { capture: "viewport" });

      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        // ── 1. Author the module (same shape as Flow #7). ─────────────────
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.apiGetEditingVersionId(module.id, branchId).then(
            (moduleVersionId) => {
              cy.apiGetDataSourceIdByName(dsName).then((dsId) => {
                gitSyncDualWs.createRestQuery({
                  appId: module.id,
                  versionId: moduleVersionId,
                  branchId,
                  dsId,
                  queryName,
                });

                gitSyncDualWs.addComponents({
                  appId: module.id,
                  versionId: moduleVersionId,
                  branchId,
                  diff: {
                    [gitSyncDualWs.componentId()]:
                      gitSyncDualWs.buttonComponent({
                        name: "runquerybtn",
                        text: "Run query",
                      }),
                    [gitSyncDualWs.componentId()]: gitSyncDualWs.textComponent({
                      name: "modulemarker",
                      text: `flow9-mod-${testId}`,
                      layout: {
                        desktop: { top: 90, left: 10, width: 12, height: 40 },
                        mobile: { top: 90, left: 10, width: 12, height: 40 },
                      },
                    }),
                  },
                });

                cy.apiEditorPush(
                  module.id,
                  moduleVersionId,
                  `test: add module ${moduleName}`,
                  branchName,
                  moduleName,
                );
                cy.gitHubWaitForCommitMessage(branchName, moduleName);
              });
            },
          );

          // ── 2. Author the app — a ModuleViewer pointing at the module. ─
          cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
            cy.apiGetEditingVersionId(app.id, branchId).then((appVersionId) => {
              gitSyncDualWs.addComponents({
                appId: app.id,
                versionId: appVersionId,
                branchId,
                diff: {
                  [gitSyncDualWs.componentId()]:
                    gitSyncDualWs.moduleViewerComponent({
                      name: "embeddedmodule",
                      moduleId: module.id,
                      // moduleVersionId: "" → follow-latest (pinning is Flow #11).
                    }),
                },
              });

              cy.apiEditorPush(
                app.id,
                appVersionId,
                `test: add app ${appName} embedding module`,
                branchName,
                appName,
              );
              cy.gitHubWaitForCommitMessage(branchName, appName);
              cy.apiGitSyncPush(`test: dashboard push ${appName}`, branchId);
            });
          });
          cy.screenshot("02-after-push", { capture: "viewport" });
        });
      });

      // ── GitHub ── PR + merge ──────────────────────────────────────────
      gitSyncDualWs.mergePr({
        branchName,
        message: `test: add app+module ${appName}`,
      });
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull, find module + app, open app in builder ─────────
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();
      cy.screenshot("04-after-pull-master", { capture: "viewport" });

      cy.visit(`/${prodIdRef.value}/modules`);
      cy.contains('[data-cy$="-card"]', moduleName, { timeout: 60000 }).should(
        "be.visible",
      );
      cy.screenshot("05-module-card-found", { capture: "viewport" });

      cy.visit(`/${prodIdRef.value}/`);
      cy.contains('[data-cy$="-card"]', appName, { timeout: 60000 }).should(
        "be.visible",
      );
      cy.screenshot("06-app-card-found", { capture: "viewport" });

      cy.gitSyncOpenAppInBuilder(appName);
      cy.skipEditorPopover();
      cy.screenshot("07-prod-app-builder-open", { capture: "viewport" });

      // Locked-master read state. [data-cy="locked-branch-banner"] isn't
      // rendered on the app editor's DOM (different from module editor's),
      // so .query-details.disabled is the available signal.
      cy.get(".query-details").should("have.class", "disabled");

      // ModuleViewer rendered on the app's canvas.
      cy.get('[data-cy="draggable-widget-embeddedmodule"]', {
        timeout: 30000,
      }).should("exist");
      cy.screenshot("08-prod-app-embeds-module", { capture: "viewport" });
    });
  },
);
