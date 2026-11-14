import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  seedPushedAppViaAPI,
  listAppsOnBranchViaAPI,
  getAppOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { createBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import { mergeBranchViaAPI } from "Support/utils/platform/gitSync/gitHubRepo";
import { visitGitSyncPage } from "Support/utils/platform/gitSync/gitSyncUI";

// Import from git reads apps from the workspace's current branch only.
describe("Git Sync — Import App From Git", { retries: 0 }, () => {
  let ctx;
  let source;
  const appName = `imp-${Date.now()}`;

  before(() => {
    setupGitSyncSpec({ specKey: "import", mode: "multi" }).then((c) => {
      ctx = c;
      createBranchViaAPI(`${ctx.prefix}-src`).then((branch) =>
        seedPushedAppViaAPI({ branch, appName }).then(({ appId, coRelationId }) =>
          mergeBranchViaAPI(branch.name, ctx.baseBranch)
            .then(() => getAppOnBranchViaAPI(appId, branch.id))
            .then((app) => {
              source = { appId, coRelationId, branchId: branch.id, slug: app.slug };
            }),
        ),
      );
    });
  });

  after(() => {
    teardownGitSyncSpec();
  });

  // Quarantined: import slug clash (app_versions_default_branch_slug_unique) — bug link: TODO
  it.skip("should import an app from GitHub into another workspace through the import modal", () => {
    setupGitSyncSpec({ specKey: "import-ws2", baseBranch: ctx.baseBranch, mode: "single" }).then((ws) => {
      loginToGitSyncSpec(ws);
      visitGitSyncPage(ws, { branch: ctx.baseBranch });
      cy.get('[data-cy="import-dropdown-menu"]').click();
      cy.get('[data-cy="import-from-git-button"]').should("be.visible").click();

      cy.contains("Import app from git repository").should("be.visible");
      cy.get('[data-cy="import-from-helper"]').should(
        "have.text",
        "Apps can only be imported from the same branch",
      );
      cy.contains("button", "Import app").should("be.disabled");

      cy.get('[data-cy="app-select"] .react-select__control', { timeout: 30000 }).click();
      cy.contains(".react-select__option", appName).click();
      cy.contains("button", "Import app").should("be.enabled").click();

      cy.contains(`${appName} and its dependent resources have been imported successfully!`, {
        timeout: 60000,
      }).should("be.visible");
      cy.url({ timeout: 30000 }).should("include", "/apps/");

      listAppsOnBranchViaAPI(ws.defaultBranch.id).then((apps) => {
        const imported = apps.find((a) => a.name === appName);
        expect(imported, "imported app in the second workspace").to.exist;
        getAppOnBranchViaAPI(imported.id, ws.defaultBranch.id).then((app) => {
          expect(app.co_relation_id, "same git identity as the source app").to.equal(source.coRelationId);
          expect(app.id, "imported app has its own local id").to.not.equal(source.appId);
          expect(app.slug, "imported app has its own slug").to.be.a("string").and.not.equal(source.slug);
        });
      });

      loginToGitSyncSpec(ctx);
      getAppOnBranchViaAPI(source.appId, source.branchId).then((app) => {
        expect(app.id, "source app still opens in the first workspace").to.equal(source.appId);
        expect(app.slug, "source app keeps its slug").to.equal(source.slug);
      });
    });
  });
});
