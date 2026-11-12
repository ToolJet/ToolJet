import {
  setupGitSyncSpec,
  loginToGitSyncSpec,
  teardownGitSyncSpec,
  seedPushedAppViaAPI,
  listAppsOnBranchViaAPI,
} from "Support/utils/platform/gitSync/gitSyncSeed";
import { createBranchViaAPI } from "Support/utils/platform/gitSync/workspaceBranch";
import { mergeBranchViaAPI } from "Support/utils/platform/gitSync/gitHubRepo";
import { visitGitSyncPage } from "Support/utils/platform/gitSync/gitSyncUI";

// A second workspace connected to the same GitHub branch brings an app in through
// "Import from git repository" (frontend/src/HomePage/HomePage.jsx toggleGitRepositoryImportModal /
// importGitApp). Import reads apps from the workspace's current branch only.
describe("Git Sync — Import App From Git", { retries: 0 }, () => {
  let ctx;
  const appName = `imp-${Date.now()}`;

  before(() => {
    setupGitSyncSpec({ specKey: "import", mode: "multi" }).then((c) => {
      ctx = c;
      createBranchViaAPI(`${ctx.prefix}-src`).then((branch) =>
        seedPushedAppViaAPI({ branch, appName }).then(() =>
          mergeBranchViaAPI(branch.name, ctx.baseBranch),
        ),
      );
    });
  });

  after(() => {
    teardownGitSyncSpec();
  });

  it("should import an app from GitHub into another workspace through the import modal", () => {
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
        expect(apps.map((a) => a.name), "imported app in the second workspace").to.include(appName);
      });
    });
  });
});
