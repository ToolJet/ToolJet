import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// Flow #11 from the dev→prod user-flows gist:
//   "App pins to a specific module version at building [current branch or any
//    version]. Updating the module on Dev does not silently change behaviour
//    of an already-released app version on Prod until the app is re-released."
//
// ── Scope of this spec ──────────────────────────────────────────────────────
// The contract under test has two halves, both automated here in one `it`:
//   (a) An app pinned to module v1 serializes `moduleVersionId = v1id` in
//       git, and Prod's importer preserves that pin after pull.
//   (b) When the module is bumped to v2 on a NEW feature branch and merged
//       to master (edits-only-on-feature-branch model), Prod pulls v2 of
//       the module but the app's pin metadata DOES NOT auto-bump — it
//       still points at v1's reference_id. This is the "no silent
//       behaviour change of released app on Prod" half of the gist.
//
// The full release+launch verification (runtime render check) is the third
// leg — still deferred behind locked-master state on Prod's main. The pin
// metadata is what determines runtime behaviour, so half-a + half-b cover
// the substantive contract.
//
// Most of the per-step API plumbing lives in gitSyncDualWs.* helpers
// (createSameNameDsOnBoth, addComponents, mergePr, findProdAppId,
// readModuleViewerPin, etc.) — see that file for the API endpoints each
// helper hits.
describe(
  "Git Sync — Flow #11: Module version pinning to released app",
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow11-${testId}`;
    const v2BranchName = `test-flow11-v2-${testId}`;
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

    it("Pin survives git, AND doesn't auto-bump when module is bumped to v2 on a new branch", () => {
      cy.screenshot("00-it-start", { capture: "viewport" });

      // ── DEV — set up feature branch and switch UI to it ───────────────
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(branchName);
      cy.screenshot("01-after-ui-switch-branch", { capture: "viewport" });

      // ── DEV — author module v1 + capture its module_reference_id ──────
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.getAuthHeaders().then((headers) => {
            cy.request({
              method: "GET",
              url: `${Cypress.env("server_host")}/api/apps/${module.id}`,
              headers: { ...headers, "x-branch-id": branchId },
            }).then((res) => {
              const v = res.body?.editing_version;
              const moduleVersionId = v?.id;
              const v1ReferenceId =
                v?.module_reference_id ?? v?.moduleReferenceId;
              expect(moduleVersionId, "module editing version id").to.be.a(
                "string",
              );
              expect(v1ReferenceId, "v1 reference_id").to.be.a("string");
              Cypress.env("flow11_v1_reference_id", v1ReferenceId);
              cy.log(`[gitSync] v1 reference_id = ${v1ReferenceId}`);

              // Drop a v1 marker Text into the module.
              gitSyncDualWs.addComponents({
                appId: module.id,
                versionId: moduleVersionId,
                branchId,
                diff: {
                  [gitSyncDualWs.componentId()]: gitSyncDualWs.textComponent({
                    name: "v1marker",
                    text: `flow11-v1-${testId}`,
                  }),
                },
              });

              // Push module to git.
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

          // ── DEV — author app pinned to v1's reference_id ──────────────
          cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
            cy.apiGetEditingVersionId(app.id, branchId).then((appVersionId) => {
              gitSyncDualWs.addComponents({
                appId: app.id,
                versionId: appVersionId,
                branchId,
                diff: {
                  [gitSyncDualWs.componentId()]:
                    gitSyncDualWs.moduleViewerComponent({
                      name: "embeddedmodulepinned",
                      moduleId: module.id,
                      moduleVersionId: Cypress.env("flow11_v1_reference_id"),
                    }),
                },
              });

              cy.apiEditorPush(
                app.id,
                appVersionId,
                `test: add app ${appName} pinned to module v1`,
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

      // ── GitHub ── first PR + merge ────────────────────────────────────
      gitSyncDualWs.mergePr({
        branchName,
        message: `test: pin app ${appName} to module v1`,
      });
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull + open app, half-a verification ──────────────────
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
      cy.get(".query-details").should("have.class", "disabled");
      cy.get('[data-cy="draggable-widget-embeddedmodulepinned"]', {
        timeout: 30000,
      }).should("exist");
      cy.screenshot("07-prod-pinned-module-viewer", { capture: "viewport" });

      // Half-a: pin metadata round-tripped through git intact.
      gitSyncDualWs
        .findProdAppId({ name: appName, prodOrgId: prodIdRef.value })
        .then((prodAppId) => {
          gitSyncDualWs
            .readModuleViewerPin({ prodAppId })
            .then((pinned) => {
              expect(
                pinned,
                "Prod's ModuleViewer pin survived git",
              ).to.equal(Cypress.env("flow11_v1_reference_id"));
              cy.log(
                `[gitSync] ✓ Half-a: pin survived (${pinned} = v1 ref id)`,
              );
            });
        });
      cy.screenshot("08-prod-pin-verified", { capture: "viewport" });

      // ──────────────────────────────────────────────────────────────────
      // Half-b — edit on feature branch, validate on main
      //   Edits live on a NEW feature branch (the v2 bump); main is for
      //   pulling + validating that the pin metadata doesn't auto-bump.
      // ──────────────────────────────────────────────────────────────────
      gitSyncDualWs.switchTo({
        workspaceId: devIdRef.value,
        workspaceSlug: devWsName,
      });
      cy.gitSyncCreateBranchViaApi(v2BranchName);
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(v2BranchName);
      cy.screenshot("09-dev-on-v2-branch", { capture: "viewport" });

      cy.gitSyncGetBranchId(v2BranchName).then((v2BranchId) => {
        cy.task("dbConnection", {
          dbconfig: Cypress.env("app_db"),
          sql: `select id from apps where name='${moduleName}' and organization_id='${devIdRef.value}' and type='module' order by created_at desc limit 1;`,
        }).then((resp) => {
          const moduleIdOnV2 = resp.rows[0]?.id;
          expect(
            moduleIdOnV2,
            `module '${moduleName}' on Dev's v2 branch`,
          ).to.be.a("string");

          cy.apiGetEditingVersionId(moduleIdOnV2, v2BranchId).then(
            (v1IdOnV2) => {
              cy.apiGetEnvironments().then((envs) => {
                const devEnv = envs.find((e) => e.name === "development");
                expect(devEnv, "Dev has a development env").to.exist;

                // Create the v2 app_version on the module (clone from v1).
                cy.getAuthHeaders().then((headers) => {
                  cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/apps/${moduleIdOnV2}/versions`,
                    headers: { ...headers, "x-branch-id": v2BranchId },
                    body: {
                      versionName: "v2",
                      versionFromId: v1IdOnV2,
                      environmentId: devEnv.id,
                    },
                    failOnStatusCode: false,
                  }).then((vRes) => {
                    expect(vRes.status, "POST v2 version").to.be.oneOf([
                      200,
                      201,
                    ]);
                    const v2VersionId = vRes.body?.id || vRes.body?.versionId;
                    expect(v2VersionId, "v2 version id").to.be.a("string");

                    // v2 marker so the v2 push has distinguishable content.
                    gitSyncDualWs.addComponents({
                      appId: moduleIdOnV2,
                      versionId: v2VersionId,
                      branchId: v2BranchId,
                      diff: {
                        [gitSyncDualWs.componentId()]:
                          gitSyncDualWs.textComponent({
                            name: "v2marker",
                            text: `flow11-v2-${testId}`,
                          }),
                      },
                    });

                    cy.apiEditorPush(
                      moduleIdOnV2,
                      v2VersionId,
                      `test: bump module ${moduleName} to v2`,
                      v2BranchName,
                      moduleName,
                    );
                    cy.gitHubWaitForCommitMessage(v2BranchName, moduleName);
                    cy.apiGitSyncPush(
                      `test: dashboard push v2 ${moduleName}`,
                      v2BranchId,
                    );
                  });
                });
              });
            },
          );
        });
      });
      cy.screenshot("10-dev-after-v2-push", { capture: "viewport" });

      // ── GitHub ── second PR + merge for the v2 bump ───────────────────
      gitSyncDualWs.mergePr({
        branchName: v2BranchName,
        message: `test: bump module ${moduleName} to v2`,
      });
      cy.screenshot("11-after-v2-pr-merge", { capture: "viewport" });

      // ── PROD ── pull master, validate pin didn't auto-bump ────────────
      gitSyncDualWs.switchTo({
        workspaceId: prodIdRef.value,
        workspaceSlug: prodWsName,
      });
      gitSyncDualWs.pullMaster();
      cy.screenshot("12-prod-after-v2-pull", { capture: "viewport" });

      // Sanity: Prod's module record still resolves.
      gitSyncDualWs.findProdAppId({
        name: moduleName,
        prodOrgId: prodIdRef.value,
        type: "module",
      });

      // Half-b core assertion: pin metadata is STILL v1's reference_id.
      gitSyncDualWs
        .findProdAppId({ name: appName, prodOrgId: prodIdRef.value })
        .then((prodAppId) => {
          gitSyncDualWs
            .readModuleViewerPin({ prodAppId })
            .then((pinAfterV2) => {
              expect(
                pinAfterV2,
                "Pin did NOT auto-bump to v2 (still v1 reference_id)",
              ).to.equal(Cypress.env("flow11_v1_reference_id"));
              cy.log(
                `[gitSync] ✓ Half-b: pin still v1 (${pinAfterV2}) after v2 sync`,
              );
            });
        });
      cy.screenshot("13-prod-pin-survives-v2-bump", { capture: "viewport" });

      // ──────────────────────────────────────────────────────────────────
      // Leg-c (deferred): promote module + app to production, release on
      // Prod, then assert the released app renders v1's content.
      //
      // Tried the REST chain
      //   PUT /api/v2/apps/{id}/versions/{vid}/promote
      //   PUT /api/apps/{id}/release  { versionToBeReleased }
      // and confirmed both endpoints exist, but draft-state versions
      // synced from git are refused by the promote endpoint with 400
      // "You cannot promote a draft version" (the same gate Flow #10
      // verifies). Saving the version first requires a writable branch
      // on Prod, which by design isn't possible. Leg-c stays deferred
      // behind either a Prod-side feature-branch helper or a different
      // test fixture that pushes saved versions through git.
      // ──────────────────────────────────────────────────────────────────

      if (!Cypress.env("CYPRESS_NO_CLEANUP")) {
        cy.gitHubDeleteBranch(v2BranchName);
      }
    });
  },
);
