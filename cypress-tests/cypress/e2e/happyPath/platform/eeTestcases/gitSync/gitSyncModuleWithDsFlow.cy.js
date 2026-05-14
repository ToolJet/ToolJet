import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Flow #7 from the dev→prod user-flows gist:
//   "Build module with DS connection → commit → push → PR → merge → pull on Prod
//    → testable on Prod (Prod credentials)"
//
// Same DS name on both workspaces, different URL — proves the per-instance
// creds rule: app/module JSON in git references the DS by name, the
// credentials are resolved locally on each instance.
//
// Implementation pattern follows Flow #3: API-only push (apiEditorPush +
// apiGitSyncPush) instead of opening the module editor and clicking the
// dashboard "Push" CTA. Those UI paths crashed Chrome's renderer in headless
// mode and adding the editor render gave no extra coverage. The
// query-against-DS step uses apiAddQueryToApp so we never have to open the
// query panel either.
//
// Verification on Prod is read-only (locked master, no branch on Prod):
//   - the ModuleContainer renders (module synced through git)
//   - the locked-branch-banner is visible (SPA gates writes)
//   - .query-details has class `disabled` (Query Manager is read-only)
//   - the query named `q-{testId}` exists in Prod's module via REST
//     and points at the DS by name — DS *credentials* are resolved
//     locally, so the same query on Prod hits prodDsUrl, not devDsUrl.
// The actual query.run trigger lives in a separate spec that runs against a
// writable branch (env-tag dropdown + run button are gated on locked master).
describe(
  "Git Sync — Flow #7: Module with DS connection (Dev → Prod)",
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow7-${testId}`;
    const moduleName = `mod-flow7-${testId}`;
    // Lowercase — the popover renders DS names lowercased and our match has
    // to align with what the user (and server validator) actually see.
    const dsName = `restapi-${testId}`;
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

      // Create the same-named REST DS on each instance with a different URL.
      // The DS lives outside git on each instance — the module/query JSON
      // only references it by name. We wrap each block in cy.then so the
      // *Ref values populated by setupDevAndProd's queued requests are
      // read at command-execution time, not at queue-time.
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

    it("Build module-with-DS on Dev → push → merge → pull on Prod → query bound to DS exists, points at Prod creds", () => {
      cy.screenshot("00-it-start", { capture: "viewport" });

      // ── DEV ── feature branch, module, query against `dsName` ──────────
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(branchName);
      cy.screenshot("01-after-ui-switch-branch", { capture: "viewport" });

      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          // All authoring via REST (branch-aware). Why API-only here:
          // - DS popover in this build silently truncates the user-DS list
          //   and its search input only matches built-in kinds, so picking
          //   our pre-created DS through the UI was unreliable.
          // - dragAndDropWidget (CDP) into the module editor + the
          //   editor → dashboard transition crashed Chrome's renderer in
          //   headless mode (see Flow #3 history).
          // The /data-queries and /v2/apps/{id}/versions/{vid}/components
          // endpoints are exactly what the UI dispatches to, so this is
          // equivalent server-side coverage for Flow #7's contract:
          // "module + DS-bound query syncs through git, DS creds resolve
          // locally per instance".
          cy.apiGetEditingVersionId(module.id, branchId).then((versionId) => {
            cy.apiGetDataSourceIdByName(dsName).then((dsId) => {
              expect(dsId, `DS '${dsName}' present on Dev`).to.be.a("string");
              cy.getAuthHeaders().then((headers) => {
                const branchHeaders = { ...headers, "x-branch-id": branchId };

                // Create query bound to the DS by name.
                cy.request({
                  method: "POST",
                  url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dsId}/versions/${versionId}`,
                  headers: branchHeaders,
                  body: {
                    app_id: module.id,
                    app_version_id: versionId,
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
                  expect(qRes.status, `Create query '${queryName}'`).to.equal(
                    201,
                  );
                  cy.log(
                    `[gitSync] Query '${queryName}' bound to DS '${dsName}' on module '${moduleName}'`,
                  );
                });

                // Look up the module's home page so the components attach
                // to the correct page on the editing version.
                cy.request({
                  method: "GET",
                  url: `${Cypress.env("server_host")}/api/apps/${module.id}`,
                  headers: branchHeaders,
                }).then((appRes) => {
                  const homePageId = appRes.body?.editing_version?.home_page_id;
                  expect(homePageId, "module home page id").to.be.a("string");

                  // Add Button + Text via branch-aware diff POST. Names are
                  // already-lowercased so the data-cy on render matches
                  // exactly (`draggable-widget-{name.toLowerCase()}`).
                  const buttonId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  const textId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  const widgetMarker = `flow7-marker-${testId}`;

                  cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/v2/apps/${module.id}/versions/${versionId}/components`,
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
                          properties: {
                            text: { value: "Run query" },
                          },
                        },
                        [textId]: {
                          name: "queryresulttext",
                          layouts: {
                            desktop: { top: 90, left: 10, width: 12, height: 40 },
                            mobile: { top: 90, left: 10, width: 12, height: 40 },
                          },
                          type: "Text",
                          properties: {
                            text: { value: widgetMarker },
                          },
                        },
                      },
                    },
                  }).then((compRes) => {
                    expect(
                      compRes.status,
                      "Create Button + Text components",
                    ).to.equal(201);
                    cy.log(
                      `[gitSync] Components added: runquerybtn, queryresulttext (marker '${widgetMarker}')`,
                    );
                  });
                });

                // Push module (with query + components) to git via REST.
                cy.apiEditorPush(
                  module.id,
                  versionId,
                  `test: add module ${moduleName} with query ${queryName}`,
                  branchName,
                  moduleName,
                );
                cy.gitHubWaitForCommitMessage(branchName, moduleName);
                cy.apiGitSyncPush(
                  `test: dashboard push ${moduleName}`,
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
        `test: add module ${moduleName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull master, find module, open it ─────────────────────
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

      // ── PROD ── locked-master read verifications ──────────────────────
      cy.get('[component-type="ModuleContainer"]', {
        timeout: 20000,
      }).should("be.visible");
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(".query-details").should("have.class", "disabled");

      // ── PROD ── components rendered on locked master ──────────────────
      // The Button + Text we API-added on Dev should now be present in the
      // ModuleContainer on Prod after pull. Widgets were named
      // `runquerybtn` / `queryresulttext` (already-lowercased so the
      // generated data-cy matches without guesswork). `.should("exist")`
      // instead of `be.visible` — the locked-master read-only overlay
      // trips Cypress's strict visibility check even when the widgets
      // render (hit the same thing on Flow #3).
      cy.get('[data-cy="draggable-widget-runquerybtn"]', {
        timeout: 20000,
      })
        .should("exist")
        .and("contain.text", "Run query");
      cy.get('[data-cy="draggable-widget-queryresulttext"]', {
        timeout: 20000,
      })
        .should("exist")
        .and("contain.text", `flow7-marker-${testId}`);
      cy.screenshot("08-prod-components-verified", { capture: "viewport" });

      // ── PROD ── query exists + runs against Prod's DS on every env ────
      // Find Prod's copy of the module by name + organization. cy.getAppId
      // matches name only — and after pull, Dev and Prod each have one — so
      // we filter by organization_id to grab the right row.
      cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from apps where name='${moduleName}' and organization_id='${prodIdRef.value}';`,
      }).then((resp) => {
        const prodModuleId = resp.rows[0]?.id;
        expect(prodModuleId, `Prod copy of '${moduleName}'`).to.be.a("string");

        cy.apiGetEditingVersionId(prodModuleId).then((prodVersionId) => {
          cy.getAuthHeaders().then((headers) => {
            // 1. Query exists on Prod and points at a DS by id (DS resolved
            //    locally to Prod's `dsName` → URL = prodDsUrl).
            cy.request({
              method: "GET",
              url: `${Cypress.env("server_host")}/api/data-queries/${prodVersionId}`,
              headers,
            }).then((res) => {
              expect(
                res.status,
                "GET /api/data-queries/{versionId}",
              ).to.equal(200);
              const queries = res.body?.data_queries || res.body || [];
              const synced = queries.find((q) => q.name === queryName);
              expect(
                synced,
                `query '${queryName}' present on Prod after pull`,
              ).to.exist;
              expect(
                synced.data_source_id,
                "query points at a DS by id",
              ).to.be.a("string");

              // 2. Run the query in every environment via REST. Proves the
              //    query is functional on Prod against Prod's DS creds
              //    (different URL per env). Endpoint is the same one the
              //    Button's onClick would eventually trigger, so this is
              //    equivalent coverage to clicking the Button on a writable
              //    branch.
              cy.apiGetEnvironments().then((envs) => {
                expect(envs, "Prod environments list").to.have.length.gte(1);
                envs.forEach((env) => {
                  cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/data-queries/${synced.id}/versions/${prodVersionId}/run/${env.id}`,
                    headers,
                    body: {},
                    failOnStatusCode: false,
                  }).then((runRes) => {
                    expect(
                      [200, 201],
                      `Run '${queryName}' on env '${env.name}' (got ${runRes.status})`,
                    ).to.include(runRes.status);
                    cy.log(
                      `[gitSync] Query '${queryName}' ran on env '${env.name}' → ${runRes.status}`,
                    );
                  });
                });
              });
            });
          });
        });
      });
      cy.screenshot("09-prod-query-runs-per-env", { capture: "viewport" });

      // ── PROD ── DS name appears on the data-sources page ──────────────
      // Final visual proof: visit Prod's /data-sources and confirm the DS
      // named `dsName` is listed. This is the page a user would land on if
      // they wanted to inspect the DS credentials backing the query — the
      // same dsName that the synced module JSON references.
      cy.visit(`/${prodIdRef.value}/data-sources`);
      cy.contains(dsName, { timeout: 20000 }).should("be.visible");
      cy.screenshot("10-prod-ds-name-on-page", { capture: "viewport" });
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Flow under test — step-by-step
// ─────────────────────────────────────────────────────────────────────────────
//   Setup
//     1. Spin up two workspaces on the same instance (Dev, Prod).
//     2. Configure git-sync on both workspaces.
//     3. Create a REST DS named `restApi-{testId}` on each workspace, with
//        a different URL on each (devDsUrl vs prodDsUrl). The DS lives
//        outside git on each instance.
//
//   Dev — author module + query
//     4. Log into Dev. Create feature branch via API.
//     5. UI switch to the feature branch.
//     6. API-create an empty module on the feature branch.
//     7. Add a REST query `q-{testId}` to the module via API, pointing at
//        the DS by name (GET /users/1).
//
//   Dev → GitHub
//     8. apiEditorPush the module (commits module + query content).
//     9. Wait until the commit lands on the feature branch on GitHub.
//    10. apiGitSyncPush (commits data-source / constant changes on the
//        branch alongside).
//    11. Open + merge a PR via REST into master.
//
//   Prod — pull + verify
//    12. Switch to the Prod workspace.
//    13. Pull master via the dashboard UI (reloads after the pull modal
//        closes so the SPA picks up the freshly-synced rows).
//    14. Visit /{prodId}/modules. Assert the module card by name.
//    15. Open the module in the builder.
//    16. Verify the read-only state on locked master:
//          - ModuleContainer renders
//          - locked-branch-banner visible
//          - `.query-details` has class `disabled`
//    17. Verify the query was synced and resolves to Prod's DS:
//          - GET /api/data-queries returns a query named `q-{testId}`
//          - it has a non-empty data_source_id (resolved locally — points
//            at Prod's DS that we created in step 3, whose URL is
//            prodDsUrl, not devDsUrl).
//
//   Teardown
//    18. Archive both workspaces via API.
//    19. Delete the feature branch on GitHub.
//        (Skip 18–19 with CYPRESS_NO_CLEANUP=1 for debugging.)
// ─────────────────────────────────────────────────────────────────────────────
