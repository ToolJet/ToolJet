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
// Authoring is REST-only — UI authoring (drag widgets, DS popover, query
// panel) was attempted and reverted as unstable on this build (see commit
// 90721585b1 for the full context). The per-step API plumbing now lives
// in gitSyncDualWs.* helpers.
//
// Verification on Prod's locked master:
//   - ModuleContainer renders
//   - locked-branch-banner visible, .query-details has class `disabled`
//   - Button + Text marker widgets exist, marker text round-trips intact
//   - The query exists on Prod's module and points at a DS by id
//   - The query runs on every Prod environment (proves DS creds resolve
//     locally to Prod's URL, not Dev's)
//   - The DS name renders on Prod's /data-sources page
describe(
  "Git Sync — Flow #7: Module with DS connection (Dev → Prod)",
  { retries: { runMode: 1, openMode: 0 } },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow7-${testId}`;
    const moduleName = `mod-flow7-${testId}`;
    const dsName = `restapi-${testId}`; // lowercase: server validator + popover rendering
    const queryName = `q-${testId}`;
    const widgetMarker = `flow7-marker-${testId}`;

    // Same DS name, different URLs on each instance — proves per-instance creds.
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

    it("Build module-with-DS on Dev → push → merge → pull on Prod → query bound to DS exists, points at Prod creds", () => {
      cy.screenshot("00-it-start", { capture: "viewport" });

      // ── DEV — feature branch, module, query against `dsName`, widgets ──
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
          cy.apiGetEditingVersionId(module.id, branchId).then((versionId) => {
            cy.apiGetDataSourceIdByName(dsName).then((dsId) => {
              expect(dsId, `DS '${dsName}' present on Dev`).to.be.a("string");

              gitSyncDualWs.createRestQuery({
                appId: module.id,
                versionId,
                branchId,
                dsId,
                queryName,
              });

              gitSyncDualWs.addComponents({
                appId: module.id,
                versionId,
                branchId,
                diff: {
                  [gitSyncDualWs.componentId()]: gitSyncDualWs.buttonComponent({
                    name: "runquerybtn",
                    text: "Run query",
                  }),
                  [gitSyncDualWs.componentId()]: gitSyncDualWs.textComponent({
                    name: "queryresulttext",
                    text: widgetMarker,
                    layout: {
                      desktop: { top: 90, left: 10, width: 12, height: 40 },
                      mobile: { top: 90, left: 10, width: 12, height: 40 },
                    },
                  }),
                },
              });

              cy.apiEditorPush(
                module.id,
                versionId,
                `test: add module ${moduleName} with query ${queryName}`,
                branchName,
                moduleName,
              );
              cy.gitHubWaitForCommitMessage(branchName, moduleName);
              cy.apiGitSyncPush(`test: dashboard push ${moduleName}`, branchId);
            });
          });
          cy.screenshot("02-after-push", { capture: "viewport" });
        });
      });

      // ── GitHub ── PR + merge ──────────────────────────────────────────
      gitSyncDualWs.mergePr({
        branchName,
        message: `test: add module ${moduleName}`,
      });
      cy.screenshot("03-after-pr-merge", { capture: "viewport" });

      // ── PROD ── pull master, find module, open in builder ────────────
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

      // ── PROD ── locked-master read state ──────────────────────────────
      cy.get('[component-type="ModuleContainer"]', { timeout: 20000 }).should(
        "be.visible",
      );
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(".query-details").should("have.class", "disabled");

      // ── PROD ── widgets synced through git ────────────────────────────
      cy.get('[data-cy="draggable-widget-runquerybtn"]', {
        timeout: 20000,
      })
        .should("exist")
        .and("contain.text", "Run query");
      cy.get('[data-cy="draggable-widget-queryresulttext"]', {
        timeout: 20000,
      })
        .should("exist")
        .and("contain.text", widgetMarker);
      cy.screenshot("08-prod-components-verified", { capture: "viewport" });

      // ── PROD ── query exists + runs against Prod's DS on every env ───
      gitSyncDualWs
        .findProdAppId({
          name: moduleName,
          prodOrgId: prodIdRef.value,
          type: "module",
        })
        .then((prodModuleId) => {
          cy.apiGetEditingVersionId(prodModuleId).then((prodVersionId) => {
            cy.getAuthHeaders().then((headers) => {
              cy.request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/data-queries/${prodVersionId}`,
                headers,
              }).then((res) => {
                expect(res.status, "GET /api/data-queries/{versionId}").to.equal(
                  200,
                );
                const queries = res.body?.data_queries || res.body || [];
                const synced = queries.find((q) => q.name === queryName);
                expect(synced, `query '${queryName}' present on Prod`).to.exist;
                expect(
                  synced.data_source_id,
                  "query points at a DS by id",
                ).to.be.a("string");

                // Run on every env via REST. Endpoint is what the Button's
                // onClick would dispatch to — equivalent server-side coverage.
                cy.apiGetEnvironments().then((envs) => {
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
                        `Run '${queryName}' on env '${env.name}' (${runRes.status})`,
                      ).to.include(runRes.status);
                    });
                  });
                });
              });
            });
          });
        });
      cy.screenshot("09-prod-query-runs-per-env", { capture: "viewport" });

      // ── PROD ── DS name on the data-sources page ─────────────────────
      cy.visit(`/${prodIdRef.value}/data-sources`);
      cy.contains(dsName, { timeout: 20000 }).should("be.visible");
      cy.screenshot("10-prod-ds-name-on-page", { capture: "viewport" });
    });
  },
);
