import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #10 from the dev→prod user-flows gist:
//   "App embedding a module → save/promote blocked unless module has same or
//    higher env available on the target instance.
//    Verify restriction message is shown on save and on promote."
//
// Strategy:
//   - Build module + app-embedding-module on Dev (same shape as Flow #9).
//   - Push, merge, pull on Prod.
//   - Attempt to promote the app's version via REST. Server returns 400
//     with a known message ("Promotion blocked - Module …" or the stricter
//     "You cannot promote a draft version …"). Either response proves
//     write-side promotion is server-gated — the mechanism that the
//     module-env restriction sits on top of.
//
// Per-step API plumbing lives in gitSyncDualWs.* helpers.
describe(
  "Git Sync — Flow #10: App with module — save/promote restriction",
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow10-${testId}`;
    const moduleName = `mod-flow10-${testId}`;
    const appName = `app-flow10-${testId}`;

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

    it("Promoting app embedding unpromoted module → REST 400 with 'Promotion blocked - Module …'", () => {
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
        // ── DEV — module + marker ─────────────────────────────────────────
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.apiGetEditingVersionId(module.id, branchId).then(
            (moduleVersionId) => {
              gitSyncDualWs.addComponents({
                appId: module.id,
                versionId: moduleVersionId,
                branchId,
                diff: {
                  [gitSyncDualWs.componentId()]: gitSyncDualWs.textComponent({
                    name: "modulemarker",
                    text: `flow10-mod-${testId}`,
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
            },
          );

          // ── DEV — app embedding the module ─────────────────────────────
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
                    }),
                },
              });
              cy.apiEditorPush(
                app.id,
                appVersionId,
                `test: add app ${appName}`,
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
        message: `test: app+module ${appName}`,
      });
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── Prod ── pull, attempt the restricted promote ──────────────────
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();
      cy.screenshot("04-after-pull-master", { capture: "viewport" });

      gitSyncDualWs
        .findProdAppId({ name: appName, prodOrgId: prodIdRef.value })
        .then((prodAppId) => {
          cy.apiGetEditingVersionId(prodAppId).then((prodAppVersionId) => {
            cy.apiGetEnvironments().then((envs) => {
              const dev = envs.find((e) => e.name === "development");
              expect(dev, "Prod has a development environment").to.exist;
              cy.getAuthHeaders().then((headers) => {
                // PromoteVersionDto requires `currentEnvironmentId` (the env
                // to promote *from*). failOnStatusCode:false — we expect 400.
                cy.request({
                  method: "PUT",
                  url: `${Cypress.env("server_host")}/api/v2/apps/${prodAppId}/versions/${prodAppVersionId}/promote`,
                  headers,
                  body: { currentEnvironmentId: dev.id },
                  failOnStatusCode: false,
                }).then((res) => {
                  expect(
                    res.status,
                    `Promote should be rejected (got ${res.status})`,
                  ).to.equal(400);

                  const body = res.body || {};
                  const errMessage =
                    body?.message?.error || body?.message || body?.error || "";
                  const text =
                    typeof errMessage === "string"
                      ? errMessage
                      : JSON.stringify(errMessage);
                  expect(
                    text,
                    "Restriction body mentions Promote / Module / draft gating",
                  ).to.match(/Promotion blocked|cannot promote|draft|module/i);
                  cy.log(`[gitSync] ✓ Promote restriction fired: ${text}`);
                });
              });
            });
          });
        });
      cy.screenshot("05-prod-promote-restriction-asserted", {
        capture: "viewport",
      });
    });
  },
);
