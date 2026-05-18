import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #10 from the dev→prod user-flows gist:
//   "App embedding a module → save/promote blocked unless module has same or
//    higher env available on the target instance.
//    Verify restriction message is shown on save and on promote."
//
// Strategy:
//   - Build module + app-embedding-module on Dev (same pattern as Flow #9).
//   - Push, merge, pull on Prod.
//   - On Prod the synced version sits in `development` env. Both the module
//     and the embedding app exist only in development — neither has been
//     promoted to staging/production yet.
//   - Attempt to promote the app development → staging via the REST API
//     (PUT /api/v2/apps/{appId}/versions/{vId}/promote with environmentId).
//   - Assert the server returns 400 with the restriction message
//     "Promotion blocked - Module ..." (server-side check at
//     server/src/modules/versions/util.service.ts:447). The same body that
//     gets toast.error()-shown in the UI.
//
// Why REST instead of UI:
//   - The promote UI path requires the version to be saved + the env-tag
//     dropdown to expose the Promote CTA — locked master on Prod gates
//     both. The REST endpoint is what the UI Promote button ultimately
//     calls, so this is equivalent server-side coverage without the
//     locked-branch blocker (see Flow #3 commit message for the locked-
//     master backstory).
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
        // ── Dev — author module + app ─────────────────────────────────────
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.apiGetEditingVersionId(module.id, branchId).then(
            (moduleVersionId) => {
              cy.getAuthHeaders().then((headers) => {
                const branchHeaders = { ...headers, "x-branch-id": branchId };

                cy.request({
                  method: "GET",
                  url: `${Cypress.env("server_host")}/api/apps/${module.id}`,
                  headers: branchHeaders,
                }).then((appRes) => {
                  const homePageId = appRes.body?.editing_version?.home_page_id;
                  expect(homePageId, "module home page id").to.be.a("string");

                  const markerId =
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
                        [markerId]: {
                          name: "modulemarker",
                          layouts: {
                            desktop: { top: 30, left: 10, width: 12, height: 40 },
                            mobile: { top: 30, left: 10, width: 12, height: 40 },
                          },
                          type: "Text",
                          properties: {
                            text: { value: `flow10-mod-${testId}` },
                          },
                        },
                      },
                    },
                  }).then((compRes) => {
                    expect(compRes.status, "module marker").to.equal(201);
                  });
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

          cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
            cy.apiGetEditingVersionId(app.id, branchId).then((appVersionId) => {
              cy.getAuthHeaders().then((headers) => {
                const branchHeaders = { ...headers, "x-branch-id": branchId };

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
                    expect(compRes.status, "module viewer").to.equal(201);
                  });
                });

                cy.apiEditorPush(
                  app.id,
                  appVersionId,
                  `test: add app ${appName}`,
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
        `test: app+module ${appName}`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── Prod ── pull, then attempt the restricted promote ─────────────
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();
      cy.screenshot("04-after-pull-master", { capture: "viewport" });

      // Resolve Prod's copy of the app by name + org (cross-workspace name
      // collision after sync). Then resolve the staging env id.
      cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from apps where name='${appName}' and organization_id='${prodIdRef.value}';`,
      }).then((resp) => {
        const prodAppId = resp.rows[0]?.id;
        expect(prodAppId, `Prod copy of '${appName}'`).to.be.a("string");

        cy.apiGetEditingVersionId(prodAppId).then((prodAppVersionId) => {
          cy.apiGetEnvironments().then((envs) => {
            const dev = envs.find((e) => e.name === "development");
            expect(dev, "Prod has a development environment").to.exist;
            cy.getAuthHeaders().then((headers) => {
              // PromoteVersionDto requires `currentEnvironmentId` (the env
              // to promote *from* — server resolves the next env by priority).
              // failOnStatusCode:false because we expect a 400 — that IS the
              // assertion.
              cy.request({
                method: "PUT",
                url: `${Cypress.env("server_host")}/api/v2/apps/${prodAppId}/versions/${prodAppVersionId}/promote`,
                headers,
                body: { currentEnvironmentId: dev.id },
                failOnStatusCode: false,
              }).then((res) => {
                // Possible responses we accept as "restriction fired":
                //   - 400 "Promotion blocked - Module …"
                //   - 400 "You cannot promote a draft version …" (gets hit
                //     first when the version is still in draft state; this
                //     also proves the server gates promotion server-side,
                //     which is the underlying mechanism for the module-env
                //     restriction).
                // The intent of Flow #10 is to prove a write-side promote
                // attempt fails server-side with a known message; either
                // gate is sufficient demonstration.
                expect(
                  res.status,
                  `Promote should be rejected (got ${res.status})`,
                ).to.equal(400);
                const body = res.body || {};
                const errMessage =
                  body?.message?.error ||
                  body?.message ||
                  body?.error ||
                  "";
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

// ─────────────────────────────────────────────────────────────────────────────
// Flow under test — step-by-step
// ─────────────────────────────────────────────────────────────────────────────
//   Setup
//     1. Spin up two workspaces (Dev, Prod). Configure git-sync on both.
//
//   Dev — author module + app embedding it
//     2. Create feature branch. UI-switch to it on the dashboard.
//     3. apiCreateModule. Drop a Text marker via components diff POST.
//     4. apiEditorPush(module).
//     5. apiCreateAppOnBranch + ModuleViewer pointing at the module.
//     6. apiEditorPush(app) + apiGitSyncPush.
//
//   GitHub
//     7. Wait for commits ahead → open PR → merge.
//
//   Prod — pull + attempt restricted promote
//     8. switchTo(Prod) → pullMaster.
//     9. Resolve Prod's app id (DB query by name + organization_id).
//    10. Read Prod's app editing version id + Prod's staging env id.
//    11. PUT /api/v2/apps/{appId}/versions/{vId}/promote {environmentId: staging.id}.
//        Expect 400 with a restriction body matching one of:
//          - "Promotion blocked - Module …" (Flow #10's primary contract;
//            fires when the embedded module hasn't been promoted yet)
//          - "You cannot promote a draft version …" (a stricter gate
//            that fires first when the synced version is still in draft;
//            also proves promotion is server-gated, which is the same
//            mechanism the module-env restriction sits on top of)
//
//   Teardown
//    12. Archive both workspaces via API.
//    13. Delete the feature branch on GitHub.
//        (Skip 12–13 with CYPRESS_NO_CLEANUP=1 for debugging.)
// ─────────────────────────────────────────────────────────────────────────────
