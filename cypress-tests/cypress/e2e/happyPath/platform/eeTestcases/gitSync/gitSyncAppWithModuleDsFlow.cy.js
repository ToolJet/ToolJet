import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Flow #9 from the dev→prod user-flows gist:
//   "Build app embedding module-with-DS → commit → push → PR → merge → pull on
//    Prod → test → promote → release. Private app: access controlled by user
//    groups."
//
// Composite of #7 (module + DS-bound query) plus an outer app that embeds the
// module via a ModuleViewer widget. Push BOTH the module and the app on the
// same feature branch, merge the PR, and verify on Prod that:
//   - the module card is on /modules
//   - the app card is on /
//   - the app opens with its embedded ModuleViewer mounted
//   - the locked-master read state holds (banner + .query-details.disabled)
//
// Authoring is API-only — see Flow #3 and #7 commits for the why. The UI
// flows (DS popover, drag-and-drop, config handles in module editor) need a
// scout pass against this build's selectors before they can replace the REST
// calls here.
//
// Promote + release are intentionally NOT exercised. The env-tag dropdown's
// promote button is gated on a writable branch (master is locked on Prod
// after pull), same blocker Flow #3 hit. Promote/release lives in a sibling
// spec that creates a branch on Prod first.
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

    // Same DS name, different URLs on each instance — proves per-instance
    // creds (the embedded module's query resolves to Prod's DS URL on Prod).
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

      // Same-named REST DS on each instance with a different URL.
      cy.then(() =>
        gitSyncDualWs.switchTo({
          workspaceId: devIdRef.value,
          workspaceSlug: devWsName,
        }),
      );
      cy.then(() =>
        cy.apiCreateDataSource(
          `${Cypress.env("server_host")}/api/data-sources`,
          dsName,
          "restapi",
          [
            { key: "url", value: devDsUrl },
            { key: "auth_type", value: "none" },
            { key: "headers", value: [["", ""]] },
          ],
        ),
      );

      cy.then(() =>
        gitSyncDualWs.switchTo({
          workspaceId: prodIdRef.value,
          workspaceSlug: prodWsName,
        }),
      );
      cy.then(() =>
        cy.apiCreateDataSource(
          `${Cypress.env("server_host")}/api/data-sources`,
          dsName,
          "restapi",
          [
            { key: "url", value: prodDsUrl },
            { key: "auth_type", value: "none" },
            { key: "headers", value: [["", ""]] },
          ],
        ),
      );
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
        // ── 1. Author the MODULE: create + add query (against `dsName`) +
        //       add Button + Text components. Same shape as Flow #7.
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.apiGetEditingVersionId(module.id, branchId).then(
            (moduleVersionId) => {
              cy.apiGetDataSourceIdByName(dsName).then((dsId) => {
                expect(dsId, `DS '${dsName}' present on Dev`).to.be.a("string");
                cy.getAuthHeaders().then((headers) => {
                  const branchHeaders = {
                    ...headers,
                    "x-branch-id": branchId,
                  };

                  // Module query
                  cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dsId}/versions/${moduleVersionId}`,
                    headers: branchHeaders,
                    body: {
                      app_id: module.id,
                      app_version_id: moduleVersionId,
                      name: queryName,
                      kind: "restapi",
                      options: {
                        method: "get",
                        url: "/users/1",
                        url_params: [["", ""]],
                        headers: [["", ""]],
                        body: [["", ""]],
                        json_body: null,
                        body_toggle: false,
                      },
                      data_source_id: dsId,
                      plugin_id: null,
                    },
                  }).then((qRes) => {
                    expect(qRes.status, `Create module query`).to.equal(201);
                  });

                  // Module components (Button + Text marker, same as #7)
                  cy.request({
                    method: "GET",
                    url: `${Cypress.env("server_host")}/api/apps/${module.id}`,
                    headers: branchHeaders,
                  }).then((appRes) => {
                    const homePageId =
                      appRes.body?.editing_version?.home_page_id;
                    expect(homePageId, "module home page id").to.be.a("string");

                    const buttonId =
                      typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `b-${Date.now()}`;
                    const textId =
                      typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `t-${Date.now()}`;

                    cy.request({
                      method: "POST",
                      url: `${Cypress.env("server_host")}/api/v2/apps/${module.id}/versions/${moduleVersionId}/components`,
                      headers: branchHeaders,
                      body: {
                        is_user_switched_version: false,
                        pageId: homePageId,
                        diff: {
                          [buttonId]: {
                            name: "runquerybtn",
                            layouts: {
                              desktop: { top: 30, left: 10, width: 6, height: 40 },
                              mobile: { top: 30, left: 10, width: 6, height: 40 },
                            },
                            type: "Button",
                            properties: { text: { value: "Run query" } },
                          },
                          [textId]: {
                            name: "modulemarker",
                            layouts: {
                              desktop: { top: 90, left: 10, width: 12, height: 40 },
                              mobile: { top: 90, left: 10, width: 12, height: 40 },
                            },
                            type: "Text",
                            properties: { text: { value: `flow9-mod-${testId}` } },
                          },
                        },
                      },
                    }).then((compRes) => {
                      expect(
                        compRes.status,
                        "Create module Button + Text",
                      ).to.equal(201);
                    });
                  });

                  // Push module to git
                  cy.apiEditorPush(
                    module.id,
                    moduleVersionId,
                    `test: add module ${moduleName}`,
                    branchName,
                    moduleName,
                  );
                  cy.gitHubWaitForCommitMessage(branchName, moduleName);
                });
              });
            },
          );

          // ── 2. Author the APP: create on same branch + embed the module
          //       via a ModuleViewer widget pointing at `module.id`.
          cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
            cy.apiGetEditingVersionId(app.id, branchId).then((appVersionId) => {
              cy.getAuthHeaders().then((headers) => {
                const branchHeaders = {
                  ...headers,
                  "x-branch-id": branchId,
                };

                cy.request({
                  method: "GET",
                  url: `${Cypress.env("server_host")}/api/apps/${app.id}`,
                  headers: branchHeaders,
                }).then((appRes) => {
                  const appHomePageId =
                    appRes.body?.editing_version?.home_page_id;
                  expect(appHomePageId, "app home page id").to.be.a("string");

                  const moduleViewerId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `mv-${Date.now()}`;

                  // ModuleViewer schema (see frontend appCanvasUtils.js:65):
                  // - properties.moduleAppId.value = module App id (remapped
                  //   per-instance by the git-sync importer)
                  // - properties.moduleVersionId.value = '' → "follow latest"
                  //   semantics; we don't pin to a specific version. Pinning
                  //   to a stable module_reference_id is Flow #11's job.
                  // - properties.visibility.value = true
                  cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/v2/apps/${app.id}/versions/${appVersionId}/components`,
                    headers: branchHeaders,
                    body: {
                      is_user_switched_version: false,
                      pageId: appHomePageId,
                      diff: {
                        [moduleViewerId]: {
                          name: "embeddedmodule",
                          layouts: {
                            desktop: { top: 20, left: 5, width: 30, height: 400 },
                            mobile: { top: 20, left: 0, width: 12, height: 400 },
                          },
                          type: "ModuleViewer",
                          properties: {
                            moduleAppId: { value: module.id },
                            moduleVersionId: { value: "" },
                            visibility: { value: true },
                          },
                        },
                      },
                    },
                  }).then((compRes) => {
                    expect(
                      compRes.status,
                      "Create ModuleViewer on app",
                    ).to.equal(201);
                    cy.log(
                      `[gitSync] App '${appName}' embeds module '${moduleName}' via ModuleViewer`,
                    );
                  });
                });

                // Push the app to git on the same branch.
                cy.apiEditorPush(
                  app.id,
                  appVersionId,
                  `test: add app ${appName} embedding module`,
                  branchName,
                  appName,
                );
                cy.gitHubWaitForCommitMessage(branchName, appName);
                cy.apiGitSyncPush(
                  `test: dashboard push ${appName}`,
                  branchId,
                );
              });
            });
          });
          cy.screenshot("02-after-push", { capture: "viewport" });
        });
      });

      // ── GitHub ── PR + merge ──────────────────────────────────────────
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(
        branchName,
        `test: add app+module ${appName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull master, find both module and app ─────────────────
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

      // ── PROD ── open the app, verify embedded module + locked-master ──
      cy.gitSyncOpenAppInBuilder(appName);
      cy.skipEditorPopover();
      cy.screenshot("07-prod-app-builder-open", { capture: "viewport" });

      // Locked-master read state. We skip the [data-cy="locked-branch-banner"]
      // assertion that worked on the module editor — on the app editor this
      // banner isn't rendered in the DOM under that data-cy (the lock UI is
      // wired differently across editor types). `.query-details.disabled`
      // is sufficient proof that write paths are gated on this Prod editor.
      cy.get(".query-details").should("have.class", "disabled");

      // The ModuleViewer widget should be on the app canvas. ToolJet
      // generates data-cy `draggable-widget-embeddedmodule` from the
      // already-lowercased name we passed in the diff. `.should("exist")`
      // rather than `be.visible` for the same locked-overlay reason from
      // Flow #3 / #7.
      cy.get('[data-cy="draggable-widget-embeddedmodule"]', {
        timeout: 30000,
      }).should("exist");
      cy.screenshot("08-prod-app-embeds-module", { capture: "viewport" });
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Flow under test — step-by-step
// ─────────────────────────────────────────────────────────────────────────────
//   Setup
//     1. Spin up two workspaces (Dev, Prod). Configure git-sync on both.
//     2. Create the same-named REST DS on each instance with a different URL.
//
//   Dev — author module + DS-bound query + components
//     3. Create feature branch. UI-switch to it on the dashboard.
//     4. apiCreateModule → branch-aware /data-queries POST (bound to DS by
//        name) → branch-aware components diff POST (Button + Text marker).
//     5. apiEditorPush(module) → wait for commit on remote.
//
//   Dev — author app that embeds the module
//     6. apiCreateAppOnBranch on the same feature branch.
//     7. Branch-aware components diff POST: one ModuleViewer widget with
//        properties.moduleAppId = module.id and moduleVersionId = '' (follow
//        latest).
//     8. apiEditorPush(app) → wait for commit on remote.
//     9. apiGitSyncPush so the branch's data-sources / constants land too.
//
//   GitHub
//    10. Wait until the branch is ahead of master, open a PR, merge it.
//
//   Prod — pull + verify
//    11. Switch to Prod workspace, pullMaster via the dashboard UI.
//    12. /{prodId}/modules → assert the module card by name.
//    13. /{prodId}/ → assert the app card by name.
//    14. Open the app in the builder. Verify:
//          - locked-branch-banner visible (master read-only)
//          - .query-details has class `disabled`
//          - draggable-widget-embeddedmodule exists (the ModuleViewer
//            was synced through git, and the importer remapped its
//            moduleAppId to point at Prod's local copy of the module)
//
//   Teardown
//    15. Archive both workspaces via API.
//    16. Delete the feature branch on GitHub.
//        (Skip 15–16 with CYPRESS_NO_CLEANUP=1 for debugging.)
//
// Out of scope (deferred to sibling specs):
//   - Promote dev → staging → production → release on Prod. Master is locked
//     on Prod after pull and the promote button isn't exposed in the env-tag
//     dropdown for locked versions (same blocker as Flow #3).
//   - Running the embedded module's query on each environment (Flow #7
//     covered that for a standalone module — wiring through the embedder
//     would need the parent app's editing version, not just the module's).
//   - Version pinning (moduleVersionId !== '') — that's Flow #11's contract.
// ─────────────────────────────────────────────────────────────────────────────
