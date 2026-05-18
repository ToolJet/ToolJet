import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Flow #11 from the dev→prod user-flows gist:
//   "App pins to a specific module version at building [current branch or any
//    version]. Updating the module on Dev does not silently change behaviour
//    of an already-released app version on Prod until the app is re-released."
//
// ── Scope of this spec — half-1: pin-survives-git ───────────────────────────
// The full contract has two halves:
//   (a) An app pinned to module v1 should serialize `moduleVersionId = v1id`
//       in git, and Prod's importer should preserve that pin after pull.
//   (b) Updating the module to v2 on Dev should NOT silently bump Prod's
//       pinned app to v2 — the app's pin keeps pointing at v1's content
//       until the app is explicitly re-released.
//
// This file only automates HALF (a): the pin value round-trips through git
// intact. Half (b) requires:
//   - creating a v2 of the module (the "Save as new version" UI / API flow
//     is not yet wired into our test helpers),
//   - releasing the app on Prod and launching the released version (blocked
//     by locked-master — see flow #3 / file header note below).
//
// Half (a) on its own is still a meaningful guard: it proves the schema
// keeps `properties.moduleVersionId` populated through serialize → commit →
// merge → pull → import, which is the foundation for half (b).
//
// ── Why half (b) is deferred ────────────────────────────────────────────────
// "Release app" on Prod requires a writable branch — after the git-sync
// pull, Prod is on read-only master and the Release CTA isn't exposed in
// the env-tag dropdown. Same blocker that capped Flow #3's promote/release.
// When a Prod-side `gitSyncCreateBranchOnProd` helper (or equivalent
// branch-on-Prod orchestration) lands, half (b) gets layered on top of
// this spec rather than as a separate file.
describe(
  "Git Sync — Flow #11: Module version pinning to released app",
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow11-${testId}`;
    const moduleName = `mod-flow11-${testId}`;
    const appName = `app-flow11-${testId}`;

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

    it("App pinned to module v1 on Dev keeps the pin after pull on Prod (pin survives git)", () => {
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
        // ── 1. Create the module on Dev with a v1 marker. ───────────────
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.getAuthHeaders().then((headers) => {
            const branchHeaders = { ...headers, "x-branch-id": branchId };

            // Read the module's editing version + module_reference_id.
            // module_reference_id is the cross-instance pin target — it
            // stays stable when the module syncs through git. Falling back
            // to camelCase variant since TypeORM may emit either depending
            // on serializer config (mirror of frontend's `?? moduleReferenceId`).
            cy.request({
              method: "GET",
              url: `${Cypress.env("server_host")}/api/apps/${module.id}`,
              headers: branchHeaders,
            }).then((res) => {
              const v = res.body?.editing_version;
              const moduleVersionId = v?.id;
              const moduleReferenceId =
                v?.module_reference_id ?? v?.moduleReferenceId;
              expect(moduleVersionId, "module editing version id").to.be.a(
                "string",
              );
              expect(
                moduleReferenceId,
                "module's stable cross-instance reference id (v1)",
              ).to.be.a("string");
              cy.log(
                `[gitSync] Module v1 → version ${moduleVersionId} → reference_id ${moduleReferenceId}`,
              );
              // Stash for the app's ModuleViewer pin and for the Prod-side
              // assertion at the end.
              Cypress.env("flow11_v1_reference_id", moduleReferenceId);

              // Drop a Text marker inside the module so v1 has identifiable
              // content. (Useful when we later layer half-b on top — we'll
              // assert this marker renders for the pinned app even after
              // module bumps to v2.)
              const v1MarkerId =
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
              cy.request({
                method: "POST",
                url: `${Cypress.env("server_host")}/api/v2/apps/${module.id}/versions/${moduleVersionId}/components`,
                headers: branchHeaders,
                body: {
                  is_user_switched_version: false,
                  pageId: v.home_page_id,
                  diff: {
                    [v1MarkerId]: {
                      name: "v1marker",
                      layouts: {
                        desktop: { top: 30, left: 10, width: 12, height: 40 },
                        mobile: { top: 30, left: 10, width: 12, height: 40 },
                      },
                      type: "Text",
                      properties: { text: { value: `flow11-v1-${testId}` } },
                    },
                  },
                },
              }).then((compRes) => {
                expect(compRes.status, "Create module v1 marker").to.equal(201);
              });

              // Push the module to git on the feature branch.
              cy.apiEditorPush(
                module.id,
                moduleVersionId,
                `test: add module ${moduleName} (v1)`,
                branchName,
                moduleName,
              );
              cy.gitHubWaitForCommitMessage(branchName, moduleName);
            });
          });

          // ── 2. Create the app on Dev with a ModuleViewer pinned to v1. ─
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

                  // Pin the ModuleViewer to v1's module_reference_id.
                  // moduleVersionId is a stable cross-instance id, so Prod's
                  // importer can remap it to Prod's local copy of v1.
                  const moduleViewerId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `mv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/v2/apps/${app.id}/versions/${appVersionId}/components`,
                    headers: branchHeaders,
                    body: {
                      is_user_switched_version: false,
                      pageId: appHomePageId,
                      diff: {
                        [moduleViewerId]: {
                          name: "embeddedmodulepinned",
                          layouts: {
                            desktop: { top: 20, left: 5, width: 30, height: 400 },
                            mobile: { top: 20, left: 0, width: 12, height: 400 },
                          },
                          type: "ModuleViewer",
                          properties: {
                            moduleAppId: { value: module.id },
                            moduleVersionId: {
                              value: Cypress.env("flow11_v1_reference_id"),
                            },
                            visibility: { value: true },
                          },
                        },
                      },
                    },
                  }).then((compRes) => {
                    expect(
                      compRes.status,
                      "Create pinned ModuleViewer",
                    ).to.equal(201);
                    cy.log(
                      `[gitSync] App '${appName}' pinned to module reference_id ${Cypress.env("flow11_v1_reference_id")}`,
                    );
                  });
                });

                // Push the app to git on the same branch.
                cy.apiEditorPush(
                  app.id,
                  appVersionId,
                  `test: add app ${appName} pinned to module v1`,
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
        `test: pin app ${appName} to module v1`,
        "master",
      ).then(() => cy.gitHubMergePR(Cypress.env("prNumber")));
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull master, find both, assert pin survives ───────────
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();
      cy.screenshot("04-after-pull-master", { capture: "viewport" });

      // Module card on Prod.
      cy.visit(`/${prodIdRef.value}/modules`);
      cy.contains('[data-cy$="-card"]', moduleName, { timeout: 60000 }).should(
        "be.visible",
      );
      cy.screenshot("05-module-card-found", { capture: "viewport" });

      // App card on Prod.
      cy.visit(`/${prodIdRef.value}/`);
      cy.contains('[data-cy$="-card"]', appName, { timeout: 60000 }).should(
        "be.visible",
      );
      cy.screenshot("06-app-card-found", { capture: "viewport" });

      // ── PROD ── open the app, assert the pinned ModuleViewer exists,
      //           then read the diff back via REST to confirm the pin
      //           value matches v1's reference_id (importer kept the pin).
      cy.gitSyncOpenAppInBuilder(appName);
      cy.skipEditorPopover();
      cy.get(".query-details").should("have.class", "disabled");
      cy.get('[data-cy="draggable-widget-embeddedmodulepinned"]', {
        timeout: 30000,
      }).should("exist");
      cy.screenshot("07-prod-pinned-module-viewer", { capture: "viewport" });

      // Read Prod's app components and assert the ModuleViewer's
      // moduleVersionId == v1 reference_id we captured on Dev. This is
      // the hard proof: the pin value round-tripped through git intact.
      cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from apps where name='${appName}' and organization_id='${prodIdRef.value}';`,
      }).then((resp) => {
        const prodAppId = resp.rows[0]?.id;
        expect(prodAppId, `Prod copy of '${appName}'`).to.be.a("string");

        // Components on Prod live in the `components` table joined to
        // app_versions. The properties JSON column holds the ModuleViewer's
        // moduleVersionId.value — read it directly via DB and compare to
        // v1's reference_id captured on Dev. (There's no public GET endpoint
        // that returns the full components diff, so this is the cleanest
        // path for a server-side assertion.)
        cy.task("dbConnection", {
          dbconfig: Cypress.env("app_db"),
          sql: `
            select c.properties
            from components c
            join pages p on p.id = c.page_id
            join app_versions av on av.id = p.app_version_id
            where av.app_id = '${prodAppId}'
              and c.type = 'ModuleViewer'
            limit 1;
          `,
        }).then((compsResp) => {
          expect(
            compsResp.rows?.length,
            "Prod's app has a ModuleViewer row",
          ).to.be.greaterThan(0);
          const props = compsResp.rows[0].properties;
          // Postgres jsonb can come back already parsed or as a string
          // depending on the driver — handle both.
          const parsed = typeof props === "string" ? JSON.parse(props) : props;
          const pinned = parsed?.moduleVersionId?.value;
          expect(
            pinned,
            "Prod's ModuleViewer moduleVersionId pin survived git",
          ).to.equal(Cypress.env("flow11_v1_reference_id"));
          cy.log(
            `[gitSync] ✓ Pin survived: Prod moduleVersionId = ${pinned} (matches v1 reference_id)`,
          );
        });
      });
      cy.screenshot("08-prod-pin-verified", { capture: "viewport" });
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Flow under test — step-by-step (half-a, "pin survives git")
// ─────────────────────────────────────────────────────────────────────────────
//   Setup
//     1. Spin up two workspaces (Dev, Prod). Configure git-sync on both.
//
//   Dev — author module v1 + pinned app
//     2. Create feature branch. UI-switch to it on the dashboard.
//     3. apiCreateModule. Read /api/apps/{moduleId} → capture
//        editing_version.module_reference_id (call it v1ReferenceId).
//        Add a `flow11-v1-{testId}` Text marker to the module so the
//        version-1 content is identifiable.
//        apiEditorPush(module).
//     4. apiCreateAppOnBranch. Components diff POST: one ModuleViewer
//        widget with properties.moduleVersionId = v1ReferenceId (PINNED).
//        apiEditorPush(app) → apiGitSyncPush.
//
//   GitHub
//     5. Wait for commits ahead → open PR → merge.
//
//   Prod — pull + assert pin survives
//     6. switchTo(Prod) → pullMaster.
//     7. Module card on /modules, app card on /. Open app in builder.
//     8. Assert .query-details has class `disabled` (locked-master).
//     9. Assert `[data-cy="draggable-widget-embeddedmodulepinned"]` exists
//        (the pinned ModuleViewer rendered).
//    10. Read Prod's app components via REST. Find the ModuleViewer in
//        the response. Assert its `properties.moduleVersionId.value` ===
//        v1ReferenceId. This is the hard proof: the pin round-tripped
//        through git intact, and Prod's importer remapped/preserved it.
//
// Deferred (half-b — needs new helpers + writable-branch-on-Prod):
//    11. Dev: create module v2 with a new module_reference_id and content
//        `flow11-v2-{testId}`. Push → merge → pull Prod.
//    12. Prod: re-open app, re-read components. moduleVersionId should
//        STILL equal v1ReferenceId (not auto-bumped to v2).
//    13. Prod: release the app + launch released version. Assert the
//        embedded ModuleViewer renders v1's content marker, not v2's.
//    14. Prod: re-release the app. Assert now v2's content marker shows.
// ─────────────────────────────────────────────────────────────────────────────
