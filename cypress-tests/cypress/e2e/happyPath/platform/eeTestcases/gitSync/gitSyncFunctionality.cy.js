import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";
import { navigateToAppEditor } from "Support/utils/common";
const FIXTURE = "gitSync/fixture-app.json";

const gitConfig = {
  repoUrl: Cypress.env("GITHUB_REPO_URL"),
  repoOwner: Cypress.env("GITHUB_REPO_OWNER"),
  repoName: Cypress.env("GITHUB_REPO_NAME"),
  branch: "master",
  appId: Cypress.env("GITHUB_APP_ID"),
  installationId: Cypress.env("GITHUB_APP_INSTALLATION_ID"),
  privateKey: Cypress.env("GITHUB_PRIVATE_KEY"),
};

describe("Git Sync — E2E Flow", () => {
  const testId = Date.now();

  const wsName = `gitsync-e2e-${testId}`;
  const wsSlug = wsName;

  const secondWsName = `gitsync-e2e-second-${testId}`;
  const secondWsSlug = secondWsName;

  const branchName = `test-feature-${testId}`;
  const appName = `git-sync-app-${testId}`;
  const commitMessage = `test: import fixture app [${testId}]`;

  const DS_BASE_URL = "https://jsonplaceholder.typicode.com";
  const FIXTURE_DS_NAME = "REST API";

  let workspaceId;

  const verifyAppDataIsWorking = () => {
    navigateToAppEditor(appName);
    cy.get(GS.queryStatusWidget, { timeout: 20000 }).should(
      "contain.text",
      "Query completed",
    );
  };

  const pullLatestFromMaster = () => {
    cy.get(":nth-child(2) > .tw-flex > span").click();
    cy.get(GS.modalTitle).should("be.visible");
    cy.get(GS.checkForUpdatesLabel).click();
    cy.get(".modal-footer > .tj-primary-btn", { timeout: 30000 })
      .should("be.enabled")
      .click();
    cy.wait(2000)
    cy.get(GS.modalTitle, { timeout: 45000 }).should("not.exist");
    cy.wait(4000);
  };

  const createWorkspaceConstants = () => {
    cy.apiCreateWorkspaceConstant(
      "API_BASE_URL",
      DS_BASE_URL,
      ["Global"],
      ["development", "staging", "production"],
    );
  };

  before(() => {
    cy.apiLogin();

    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);

      cy.log(`[gitSync] Workspace created: ${wsName} (${workspaceId})`);
    });

    cy.gitSyncCheckAndConfigure();

    cy.gitHubResetRepo();
  });

  after(() => {
    cy.apiLogin();
    cy.gitHubDeleteBranch(branchName);
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  describe("Block 1: Branch Creation and Nav Bar UI", () => {
    beforeEach(() => {
      cy.apiLogin();
    });

    it("creates feature branch from dashboard and verifies nav bar UI", () => {
      cy.gitSyncGoToDashboard();

      // On master: lock banner should be visible
      cy.get(GS.masterLockBanner).should("be.visible");

      // On master: only Pull button visible, no Commit button
      cy.contains("button", /^Pull$/i).should("be.visible");
      cy.contains("button", /^commit$/i).should("not.exist");

      // Branch dropdown shows master
      cy.get(GS.wsBranchHeader).click();
      cy.get(GS.wsBranchPopover).should("be.visible");
      cy.get(GS.wsCurrentBranch).should("contain.text", gitConfig.branch);

      // Create feature branch via UI
      cy.gitSyncCreateBranchViaUI(branchName);

      // Verify UI updated to new branch
      cy.get(GS.wsCurrentBranch).should("contain.text", branchName);

      // On sub-branch: Commit button appears, Pull still visible
      cy.contains("button", /^commit$/i).should("be.visible");
      cy.contains("button", /^pull$/i).should("be.visible");

      // Master lock banner gone on sub-branch
      cy.get(GS.masterLockBanner).should("not.exist");

      // Create workspace constants
      createWorkspaceConstants();

      cy.gitSyncImportAppFromFixture(FIXTURE, appName, branchName);

      cy.reload();
      cy.wait(3000);
      cy.gitSyncSwitchBranch(branchName);
      cy.get(GS.appCard).contains(appName).should("be.visible");

      cy.get(GS.appCard, { timeout: 30000 }).contains(appName).click();
      verifyAppDataIsWorking();

      cy.get(".lifecycle-cta-button > .tw-flex > span").should(
        "contain.text",
        "Commit",
      );
      cy.get(".lifecycle-cta-button > .tw-flex > span").click();

      cy.get(".modal-footer > .tj-primary-btn").should("be.disabled");
      cy.get(GS.commitMessageInput).type(commitMessage);
      cy.wait(3000);
      cy.get(".modal-footer > .tj-primary-btn").should("be.enabled");
      cy.get(".modal-footer > .tj-primary-btn").click();
      cy.get(GS.commitMessageInput, { timeout: 45000 }).should("not.exist");
      cy.wait(3000);

      cy.go("back");
      cy.wait(3000);
      cy.gitSyncSwitchBranch(branchName);

      cy.get(GS.wsBranchHeader).click();
      cy.get(GS.wsBranchPopover).should("be.visible");

      // Click Commit/Push CTA inside popover
      cy.get(":nth-child(3) > .tw-flex > span").click();

      // Push modal opens
      cy.get(GS.modalTitle).should("be.visible");

      // UI CHECK: submit disabled when message is empty
      cy.get(GS.commitMessageInput).should("be.visible").and("have.value", "");
      cy.get(".modal-footer > .tj-primary-btn").should("be.disabled");

      // Enter commit message — submit becomes enabled
      cy.get(GS.commitMessageInput).type(commitMessage);
      cy.wait(3000);
      cy.get(".modal-footer > .tj-primary-btn").should("be.enabled");

      // Push
      cy.get(".modal-footer > .tj-primary-btn").click();

      // Modal closes on success
      cy.get(GS.commitMessageInput, { timeout: 45000 }).should("not.exist");
      cy.wait(3000);

      // Verify commit landed in GitHub
      cy.request({
        method: "GET",
        url: `https://api.github.com/repos/${gitConfig.repoOwner}/${gitConfig.repoName}/branches/${branchName}`,
        headers: {
          Authorization: `Bearer ${Cypress.env("GITHUB_TOKEN")}`,
          Accept: "application/vnd.github+json",
        },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.commit.commit.message).to.include(
          commitMessage.slice(0, 30),
        );
        cy.log(
          `[gitSync] ✓ Commit verified in GitHub on branch '${branchName}'`,
        );
      });
    });

    it("creates and merges PR from feature branch to master via GitHub API", () => {
      cy.gitHubCreatePR(
        branchName,
        `test: git-sync-app-${testId} fixture import`,
        gitConfig.branch,
      ).then(() => {
        cy.log(`[gitSync] PR #${Cypress.env("prNumber")} created`);
        cy.gitHubMergePR(Cypress.env("prNumber"));
      });
    });

    it("switches to master branch and pulls from git — verifies UI", () => {
      cy.gitSyncGoToDashboard();

      // Switch to master
      cy.gitSyncSwitchBranch(gitConfig.branch);
      cy.get(GS.wsCurrentBranch).should("contain.text", gitConfig.branch);

      // Lock banner and Pull-only state restored on master
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(":nth-child(2) > .tw-flex > span").should("be.visible");
      cy.get(":nth-child(3) > .tw-flex > span").should("not.exist");

      pullLatestFromMaster();
      cy.log("[gitSync] ✓ Pull from master completed");
    });

    it("verifies app is fully functional on master after pull", () => {
      cy.gitSyncGoToDashboard();
      cy.get('[data-cy="workspace-current-branch-name"]').should(
        "contain.text",
        "master",
      );

      cy.get(GS.appCard, { timeout: 30000 }).contains(appName).should("be.visible");
      verifyAppDataIsWorking();
      cy.log("[gitSync] ✓ App functional on master — query ran successfully");
    });

    it("Pull the changes from the newly created workspace", () => {
      cy.apiCreateWorkspace(secondWsName, secondWsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);

        cy.log(`[gitSync] Workspace created: ${secondWsName} (${workspaceId})`);
      });

      cy.gitSyncCheckAndConfigure();
      cy.gitSyncGoToDashboard();

      createWorkspaceConstants();

      // Lock banner and Pull-only state restored on master
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(":nth-child(2) > .tw-flex > span").should("be.visible");
      cy.get(":nth-child(3) > .tw-flex > span").should("not.exist");

      pullLatestFromMaster();
      cy.log("[gitSync] ✓ Pull from master completed");

      cy.get(GS.appCard, { timeout: 30000 }).contains(appName).should("be.visible");
      verifyAppDataIsWorking();
    });
  });
});
