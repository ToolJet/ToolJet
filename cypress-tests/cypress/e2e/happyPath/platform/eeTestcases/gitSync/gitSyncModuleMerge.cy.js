import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";
describe(
  "Git Sync — Module Merge Scenarios (sub → main)",
  { retries: 0 },
  () => {
    const testId = Date.now();
    const wsName = `gitsync-module-${testId}`;
    const wsSlug = wsName;
    let workspaceId;

    // --- helpers -------------------------------------------------------------

    // Commit → push via the UI, then open + merge a GitHub PR via the REST API.
    // Combines existing gitSyncCommands so each test reads as a short recipe.
    const commitPushAndMerge = (branchName, message) => {
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch(branchName);
      cy.gitSyncDashboardPush(message);
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(branchName, message, "master").then(() =>
        cy.gitHubMergePR(Cypress.env("prNumber")),
      );
    };

    // Switch to master and pull — used after a PR merge so the local workspace
    // reflects the latest master state.
    const pullMaster = () => {
      cy.gitSyncGoToDashboard();
      cy.gitSyncSwitchBranch("master");
      cy.get(GS.wsGitPullBtn).click();
      cy.get(GS.modalTitle).should("be.visible");
      cy.get(GS.checkForUpdatesLabel).click();
      cy.get(GS.pullModalPullChangesBtn, { timeout: 30000 })
        .should("be.enabled")
        .click();
      cy.get(GS.modalTitle, { timeout: 45000 }).should("not.exist");
      cy.wait(2000);
    };

    // --- lifecycle -----------------------------------------------------------

    before(() => {
      // Newly-created gitsync workspaces bounce through several redirects on
      // first visit; the default cap of 3 is too tight for this spec.
      Cypress.config("redirectionLimit", 20);
    });

    before(() => {
      // Fresh workspace per run → deterministic slug, no cross-run branch
      // accumulation, and git-sync config starts clean.
      cy.apiLogin();
      cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceSlug", wsSlug);
      });
      // Re-login scoped to the new workspace — the default `apiLogin` sets
      // Cypress.env("workspaceId") back to the user's default org, which makes
      // every subsequent tj-workspace-id header point at the wrong workspace.
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
      cy.gitSyncCheckAndConfigure();
      cy.gitHubResetRepo();
    });

    beforeEach(() => {
      // Each test starts with a fresh auth cookie scoped to our workspace.
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
    });

    after(() => {
      cy.apiLogin();
      cy.then(() => cy.apiArchiveWorkspace(workspaceId));
    });

    // ===========================================================================
    // PASSING TESTS — baseline smoke for the module/app/gitsync pipeline
    // ===========================================================================

    // What: create a branch, then create a module on it via POST /api/modules,
    //       and verify the module is fetchable via GET /api/apps/:id.
    // Why:  proves module CRUD works on a gitsync-enabled workspace and that our
    //       branchId flow is correct. This is the smallest green test we can run.
    it("creates a module on a sub-branch via API", () => {
      const branchName = `test-mod-create-${testId}`;
      const moduleName = `mod-create-${testId}`;

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          expect(module.id, "created module id").to.be.a("string");
          // Confirm the module is really in the DB — apiGetModuleCorrelationId
          // performs GET /api/apps/:id under the hood (modules reuse apps).
          cy.apiGetModuleCorrelationId(module.id).then((corrId) => {
            expect(corrId, "module co_relation_id").to.be.a("string");
          });
        });
      });
    });

    // What: create a branch, then create an app on it via POST /api/apps.
    // Why:  mirrors the module-create smoke for apps, so both sides of the
    //       "app + module" matrix have a baseline greenness signal.
    it("creates an app on a sub-branch via API", () => {
      const branchName = `test-app-create-${testId}`;
      const appName = `app-create-${testId}`;

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateAppOnBranch(appName, branchId).then((app) => {
          expect(app.id, "created app id").to.be.a("string");
        });
      });
    });

    // What: create a module on a sub-branch, commit + push via the dashboard UI,
    //       then open and merge a GitHub PR via the REST API, then pull master.
    // Why:  exercises the full gitsync pipeline end-to-end for a module. Proves
    //       module creation produces a real git diff and survives a round-trip
    //       through GitHub back to the local master.
    it("commits a new module to master via sub-branch PR merge", () => {
      const branchName = `test-mod-merge-${testId}`;
      const moduleName = `mod-merge-${testId}`;

      // 1) Create branch + module via API
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId);
      });

      // 2) Commit + push via UI, then merge via GitHub API
      commitPushAndMerge(branchName, `test: add module ${moduleName}`);

      // 3) Pull master so the workspace sees the merged change
      pullMaster();

      // Sanity: master's branch in GitHub now has our commit at its tip.
      cy.request({
        method: "GET",
        url: `https://api.github.com/repos/${Cypress.env("GITHUB_REPO_OWNER")}/${Cypress.env("GITHUB_REPO_NAME")}/branches/master`,
        headers: {
          Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
          Accept: "application/vnd.github+json",
        },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.commit.commit.message).to.include(moduleName);
      });
    });

    // What: create a module on a sub-branch, rename it via PUT /api/modules/:id,
    //       then GET the module and verify the new name is persisted.
    // Why:  proves the module-rename endpoint works end-to-end. It's also the
    //       primitive we'd like to use for producing conflicting edits once the
    //       conflict-test blocker is resolved.
    it("renames a module on a sub-branch via API", () => {
      const branchName = `test-mod-rename-${testId}`;
      const originalName = `mod-before-${testId}`;
      const renamedName = `mod-after-${testId}`;

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(originalName, branchId).then((module) => {
          cy.apiRenameModule(module.id, renamedName);
          cy.getAuthHeaders().then((headers) =>
            cy
              .request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps/${module.id}`,
                headers,
              })
              .then((res) => {
                expect(res.status).to.equal(200);
                expect(res.body?.name, "module name after rename").to.equal(
                  renamedName,
                );
              }),
          );
        });
      });
    });

    // What: create a module on a sub-branch, list modules on that branch, and
    //       verify the new module is in the list.
    // Why:  exercises the modules-listing endpoint (GET /api/apps?type=module) —
    //       the same one the UI's Modules tab uses. Guards against silent
    //       regressions in module enumeration on a branch.
    it("lists a created module on its sub-branch via API", () => {
      const branchName = `test-mod-list-${testId}`;
      const moduleName = `mod-list-${testId}`;

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId);
        cy.getAuthHeaders().then((headers) =>
          cy
            .request({
              method: "GET",
              url: `${Cypress.env("server_host")}/api/apps?page=1&type=module&branch_id=${branchId}`,
              headers,
            })
            .then((res) => {
              expect(res.status).to.equal(200);
              const modules = res.body?.apps || res.body?.meta?.apps || [];
              const names = modules.map((m) => m?.name);
              expect(names, "modules listed on branch").to.include(moduleName);
            }),
        );
      });
    });

    // What: create a module on a sub-branch, delete it via DELETE /api/modules/:id
    //       scoped with the x-branch-id header, then verify the module is gone
    //       from the branch's listing.
    // Why:  covers the branch-scoped deletion path in the EE modules controller.
    //       This is the primitive we'd use for Edge Case 2 in the doc ("Deleting
    //       a module on sub-branch") once the cross-branch reference check is in
    //       play.
    it("deletes a module from a sub-branch via API", () => {
      const branchName = `test-mod-delete-${testId}`;
      const moduleName = `mod-delete-${testId}`;

      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.apiCreateModule(moduleName, branchId).then((module) => {
          cy.getAuthHeaders().then((headers) =>
            cy
              .request({
                method: "DELETE",
                url: `${Cypress.env("server_host")}/api/modules/${module.id}`,
                headers: { ...headers, "x-branch-id": branchId },
              })
              .then((res) => {
                expect(res.status, "module delete").to.be.oneOf([200, 204]);
              }),
          );
          cy.getAuthHeaders().then((headers) =>
            cy
              .request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps?page=1&type=module&branch_id=${branchId}`,
                headers,
              })
              .then((res) => {
                const names = (res.body?.apps || []).map((m) => m?.name);
                expect(names, "modules after delete").to.not.include(
                  moduleName,
                );
              }),
          );
        });
      });
    });
  },
);
