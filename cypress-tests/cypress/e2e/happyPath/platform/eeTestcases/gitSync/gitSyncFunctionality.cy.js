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
  let testRunIndex = 0;

  let wsName;
  let wsSlug;
  let secondWsName;
  let secondWsSlug;
  let branchName;
  let appName;
  let commitMessage;

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
    cy.get(GS.wsGitPullBtn).click();
    cy.get(GS.modalTitle).should("be.visible");
    cy.get(GS.checkForUpdatesLabel).click();
    cy.get(GS.pullModalPullChangesBtn, { timeout: 30000 })
      .should("be.enabled")
      .click();
    cy.wait(2000);
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

  beforeEach(() => {
    const runId = `${testId}-${testRunIndex++}`;
    wsName = `gitsync-e2e-${runId}`;
    wsSlug = wsName;
    secondWsName = `gitsync-e2e-second-${runId}`;
    secondWsSlug = secondWsName;
    branchName = `test-feature-${runId}`;
    appName = `git-sync-app-${runId}`;
    commitMessage = `test: import fixture app [${runId}]`;

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

  afterEach(() => {
    cy.apiLogin();
    cy.gitHubDeleteBranch(branchName);
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  describe("Block 1: Branch Creation and Nav Bar UI", () => {

    it("creates feature branch from dashboard and verifies nav bar UI", () => {
      cy.gitSyncGoToDashboard();

      // On master: lock banner should be visible
      cy.wait(2000)
      cy.get(GS.masterLockBanner).should("be.visible");

      // Branch dropdown shows master
      cy.get(GS.wsBranchHeader).click();
      cy.get(GS.wsBranchPopover).should("be.visible");
      cy.get(GS.wsCurrentBranch).should("contain.text", gitConfig.branch);

      // Create feature branch via UI
      cy.gitSyncCreateBranchViaUI(branchName);

      // Verify UI updated to new branch
      cy.get(GS.wsCurrentBranch).should("contain.text", branchName);


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

      cy.get(GS.lifecycleCTABtn).should(
        "contain.text",
        "Commit",
      );
      cy.get(GS.lifecycleCTABtn).click();

      cy.get(GS.modalCommitBtn).should("be.disabled");
      cy.get(GS.commitMessageInput).type(commitMessage);
      cy.wait(3000);
      cy.get(GS.modalCommitBtn).should("be.enabled");
      cy.get(GS.modalCommitBtn).click();
      cy.get(GS.commitMessageInput, { timeout: 45000 }).should("not.exist");
      cy.wait(3000);

      cy.go("back");
      cy.wait(3000);
      cy.gitSyncSwitchBranch(branchName);

      cy.get(GS.wsBranchHeader).click();
      cy.get(GS.wsBranchPopover).should("be.visible");

      // Click Commit/Push CTA inside popover
      cy.get("[data-cy='datasources-icon']").click();
      cy.get(GS.wsGitCommitBtn).should("be.visible");
      cy.get(GS.wsGitPullBtn).should("be.visible");
      cy.get(GS.wsGitCommitBtn).click();

      // Push modal opens
      cy.get(GS.modalTitle).should("be.visible");

      // UI CHECK: submit disabled when message is empty
      cy.get(GS.commitMessageInput).should("be.visible").and("have.value", "");
      cy.get(GS.modalCommitBtn).should("be.disabled");

      // Enter commit message — submit becomes enabled
      cy.get(GS.commitMessageInput).type(commitMessage);
      cy.wait(3000);
      cy.get(GS.modalCommitBtn).should("be.enabled");

      // Push
      cy.get(GS.modalCommitBtn).click();

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

      cy.gitHubCreatePR(
        branchName,
        `test: git-sync-app-${testId} fixture import`,
        gitConfig.branch,
      ).then(() => {
        cy.log(`[gitSync] PR #${Cypress.env("prNumber")} created`);
        cy.gitHubMergePR(Cypress.env("prNumber"));
      });

      cy.gitSyncGoToDashboard();

      // Switch to master
      cy.gitSyncSwitchBranch(gitConfig.branch);
      cy.get(GS.wsCurrentBranch).should("contain.text", gitConfig.branch);

      // Lock banner and Pull-only state restored on master
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(GS.wsGitPullBtn).should("be.visible");
      cy.get(GS.wsGitCommitBtn).should("not.exist");

      pullLatestFromMaster();
      cy.log("[gitSync] ✓ Pull from master completed");

      cy.gitSyncGoToDashboard();
      cy.get(GS.wsCurrentBranch).should(
        "contain.text",
        "master",
      );

      cy.get(GS.appCard, { timeout: 30000 })
        .contains(appName)
        .should("be.visible");
      verifyAppDataIsWorking();
      cy.log("[gitSync] ✓ App functional on master — query ran successfully");
    });

    it("Pull the changes from the newly created workspace", () => {
      cy.getAuthHeaders().then((headers) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organizations`,
          headers,
          body: { name: secondWsName, slug: secondWsSlug },
          failOnStatusCode: false,
        }).then((res) => {
          if (res.status === 201) {
            workspaceId = res.body.organization_id;
            Cypress.env("workspaceId", workspaceId);
            Cypress.env("workspaceSlug", secondWsSlug);
            cy.log(`[gitSync] Workspace created: ${secondWsName} (${workspaceId})`);
          } else if (res.status === 409) {
            // Workspace slug already exists (e.g. retry run) — look it up and reuse it
            cy.log(`[gitSync] Workspace slug '${secondWsSlug}' already taken — looking up existing workspace`);
            cy.apiGetWorkspaceIDs().then((workspaces) => {
              const existing = workspaces.find((ws) => ws.slug === secondWsSlug);
              expect(existing, `existing workspace with slug '${secondWsSlug}'`).to.exist;
              workspaceId = existing.id;
              Cypress.env("workspaceId", workspaceId);
              Cypress.env("workspaceSlug", secondWsSlug);
              cy.log(`[gitSync] Reusing existing workspace: ${secondWsName} (${workspaceId})`);
            });
          } else {
            expect(res.status, `Create workspace '${secondWsName}'`).to.equal(201);
          }
        });
      });

      // Configure git sync before any push operations
      cy.gitSyncCheckAndConfigure();

      // Create constants before import so the datasource URL resolves
      createWorkspaceConstants();

      // Ensure GitHub branch is clean before creating (safe no-op if it doesn't exist)
      cy.gitHubDeleteBranch(branchName);

      // Set up git state via API — branch, fixture import, editor push, dashboard push
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.gitSyncImportAppFromFixture(FIXTURE, appName, branchName).then((appId) => {
          cy.apiGetEditingVersionId(appId, branchId).then((versionId) => {
            // Editor push — commits app definition (components, pages, queries)
            cy.apiEditorPush(appId, versionId, `feat: initial push ${appName}`, branchName, appName);
            cy.gitHubWaitForCommitMessage(branchName, appName);
            // Dashboard push — syncs datasource configs internally
            cy.apiGitSyncPush(`feat: dashboard push ${appName}`, branchId);
          });
        });
      });

      // PR + merge
      cy.gitHubWaitForCommitsAhead(branchName, "master");
      cy.gitHubCreatePR(branchName, `PR: ${appName}`, "master").then((pr) =>
        cy.gitHubMergePR(pr),
      );

      cy.gitSyncGoToDashboard();

      // Lock banner and Pull-only state restored on master
      cy.wait(2000)
      cy.get(GS.masterLockBanner).should("be.visible");
      cy.get(GS.wsGitPullBtn).should("be.visible");
      cy.get(GS.wsGitCommitBtn).should("not.exist");

      pullLatestFromMaster();
      cy.log("[gitSync] ✓ Pull from master completed");

      cy.wait(2000)
      cy.get(GS.appCard, { timeout: 30000 })
        .contains(appName)
        .should("be.visible");
      verifyAppDataIsWorking();
    });
  });
});
