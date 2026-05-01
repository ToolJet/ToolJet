import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";

// ============================================================================
// Module Merge Scenarios — GitSync, sub-branch → main
// ============================================================================
//
// Covers the scenarios in docs/module-app-merge-scenarios.md that the existing
// gitSync specs (gitSyncFunctionality.cy.js, gitSyncUIConfiguration.cy.js)
// don't hit. The spec is split into two clearly-marked groups:
//
//   1. PASSING tests — baseline smoke for module/app creation and the
//      commit-push-merge gitsync pipeline on a single sub-branch.
//
//   2. BLOCKED tests — one `.skip()` per scenario we couldn't close yet.
//      Every skipped test has a "Blocker:" comment citing the exact primitive
//      that is missing or broken. Un-skip as those primitives land.
//
// Environment assumptions (set up by the before() hook):
//   - Fresh workspace with a unique slug (avoids cross-run pollution)
//   - GitSync configured via API against the GitHub App in cypress.env.json
//   - Target GitHub repo reset to an empty master at the start of the run
//
// Readability conventions:
//   - Setup/teardown lives in before/beforeEach/after
//   - Small inline helpers at the top of the describe (mergeBranchToMaster,
//     pullMaster) keep each `it` to a short, readable recipe
//   - Every test opens with a one-line "What:" / "Why:" comment
// ============================================================================

describe("Git Sync — Module Merge Scenarios (sub → main)", { retries: 0 }, () => {
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
    cy.contains("button", /^Pull$/i).click();
    cy.get(GS.modalTitle).should("be.visible");
    cy.get(GS.checkForUpdatesLabel).click();
    cy.contains("button", /pull changes/i, { timeout: 30000 })
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
      cy.apiCreateApp(appName, branchId).then((app) => {
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
              expect(res.body?.name, "module name after rename").to.equal(renamedName);
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
              expect(names, "modules after delete").to.not.include(moduleName);
            }),
        );
      });
    });
  });

  // ===========================================================================
  // BLOCKED TESTS — one `.skip()` per scenario we could not close.
  // Each block lists the doc row and the exact primitive that is missing.
  // ===========================================================================

  // Doc row: 1.2 / 3A.3 — two sub-branches edit the same module; second merge
  // must be blocked as a conflict until the conflicting branch is rebased.
  //
  // Blocker: `cy.apiRenameModule` does not produce a git-trackable diff when
  //          applied on a sub-branch (`gitHubWaitForCommitsAhead` times out
  //          with "no commits ahead of master"). To produce a real diff we
  //          would need to drop a component into the module (change module
  //          contents, not just metadata). Drop-a-component-via-API is itself
  //          blocked — see next skipped test.
  //
  // Un-skip when: either (a) a module-edit primitive that emits a git diff
  //               is available, or (b) we have a component-add primitive.
  it.skip("BLOCKED — conflict when two branches rename the same module", () => {
    // Test body omitted. Outline once un-skipped:
    //   1. Seed a module onto master via a first sub-branch merge.
    //   2. Cut branchA + branchB from master. Rename the module differently
    //      on each.
    //   3. Merge branchA → clean. Open a PR for branchB.
    //   4. Assert the PR's `mergeable_state === "dirty"` (i.e., GitHub reports
    //      a conflict).
    //   5. Resolve the conflict in branchB, retry merge, assert success.
  });

  // Doc row: 3A.1 + the "pin stickiness" fixed rule — merging a new module
  // version on main never auto-upgrades apps already pinned on main.
  //
  // Blocker: `POST /api/v2/apps/:id/versions/:vid/components` (the endpoint
  //          that would wire a ModuleViewer into the app) returns
  //          `400: pageId must be a UUID`. Freshly-created apps come back with
  //          `pages: []` — no default page is provisioned by POST /api/apps,
  //          and we don't yet have a verified API path to create one.
  //
  // Un-skip when: we have an `apiCreatePage(appId, versionId)` helper (or
  //               have confirmed a payload shape that POST /components
  //               accepts for an un-paged app).
  it.skip("BLOCKED — preserves app's module pin after unrelated module edit on main", () => {
    // Outline once un-skipped:
    //   1. Branch A: create module M, create app pinning M@branchA, merge A.
    //   2. Branch B: rename/edit module M, merge B.
    //   3. Pull master, GET app, assert `moduleVersionId.value === "branchA"`.
  });

  // Doc row: 3A.5 — pin points at a version removed on main; UI surfaces the
  // break; the fix is a new sub-branch that repoints the pin.
  //
  // Blockers (two independent ones):
  //   (a) Same module-pin placement blocker as the test above.
  //   (b) No broken-pin UI selector was observed during the live-UI scout
  //       (see cypress-tests/docs/PR-16020-git-sync-automation-context.md
  //       "Surprises / blockers"). Without a selector we can't assert the
  //       warning actually appears.
  //
  // Un-skip when: both blockers are resolved.
  it.skip("BLOCKED — surfaces broken pin when pinned module version is removed on main", () => {
    // Outline once un-skipped:
    //   1. Branch A: create module + app pinning M v1, merge A.
    //   2. Branch B: remove M v1 (endpoint TBD), merge B.
    //   3. Pull master, open app, assert broken-pin banner visible.
    //   4. Branch F: repoint app's pin to a valid version, merge F.
    //   5. Pull master, assert banner is gone.
  });

  // Doc row: 3B.1 — app pins the sub-branch's own module version; post-merge,
  // the app on main references that module as a *draft*.
  //
  // Blocker: same as the sticky-pin test — can't place a ModuleViewer with a
  //          draft pin on an app via API.
  //
  // Un-skip when: component placement is unblocked. The assertion is simple:
  //               after merge + pull, `moduleVersionId.value === branchName`.
  it.skip("BLOCKED — references module as draft on main when app pins sub-branch's module version", () => {
    // Outline once un-skipped:
    //   1. Branch A: create module M + app with ModuleViewer pinned to
    //      `moduleVersionId = branchA` (the current-branch draft).
    //   2. Commit + push, merge A to master, pull master.
    //   3. GET app on master, assert `moduleVersionId.value === branchA`.
  });
});
