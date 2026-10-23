import { fake } from "Fixtures/fake";
import { gitSyncSelectors as sel } from "Selectors/platform/gitsync";

describe("Git Sync — UI Configuration", () => {
  const gitConfig = {
    repoUrl: Cypress.env("GITHUB_REPO_URL"),
    branch: "master",
    appId: Cypress.env("GITHUB_APP_ID"),
    installationId: Cypress.env("GITHUB_APP_INSTALLATION_ID"),
    privateKey: Cypress.env("GITHUB_PRIVATE_KEY"),
  };

  beforeEach(() => {
    const wsName = `gitsync-create-${fake.firstName.toLowerCase()}`;
    const wsSlug = wsName;
    let createdWorkspaceId;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      createdWorkspaceId = res.body.organization_id;
      Cypress.env("workspaceId", createdWorkspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });
    cy.viewport(1800, 1400);
  });

  afterEach(() => {
    cy.apiLogin();
    cy.apiArchiveWorkspace(Cypress.env("workspaceId"));
  });

  it("should configure GitHub git sync via UI, verify all modals on Dashboard and Data Sources, delete config via UI, then archive workspace", () => {
    // Open configure-git page — verify disabled state
    cy.intercept("GET", "**/api/git-sync/**").as("gitSyncInit");
    cy.visit(`${Cypress.config("baseUrl")}/${Cypress.env("workspaceSlug")}/workspace-settings/configure-git`);
    cy.contains("Configure git sync", { timeout: 15000 }).should("be.visible");
    cy.wait("@gitSyncInit");
    cy.wait(2000);

    cy.get('[data-cy="github-git-card"]', { timeout: 30000 })
      .should("be.visible")
      .click();
    cy.get('[data-cy="modal-component"]', { timeout: 30000 }).should("be.visible");

    cy.get('[data-cy="modal-component"]').within(() => {
      cy.contains("GitHub").should("be.visible");
      cy.contains(sel.githubDisabledBadge).should("be.visible");
    });

    cy.log("[gitSync] ✓ Disabled badge verified before configuration");

    // Fill form → Test connection → Save
    cy.get(sel.repoUrlInput).clear().type(gitConfig.repoUrl);
    cy.get(sel.branchInput).clear().type(gitConfig.branch);
    cy.get(sel.appIdInput).clear().type(gitConfig.appId);
    cy.get(sel.installationIdInput).clear().type(gitConfig.installationId);
    cy.get(sel.privateKeyInput).clear().type(gitConfig.privateKey, { delay: 0 });

    cy.wait(1000);
    cy.contains("button", sel.testConnectionBtn).click();
    cy.contains("button", sel.saveConfigBtn, { timeout: 15000 }).should(
      "not.be.disabled",
    );
    cy.contains("button", sel.saveConfigBtn).click();

    cy.get('[data-cy="modal-component"]').should("not.exist");
    cy.get('[data-cy="github-toggle"]').should("be.checked");

    cy.log("[gitSync] ✓ Git sync configured and enabled via UI");

    // Re-open modal — verify Enabled badge and saved values
    cy.get('[data-cy="github-git-card"]').click();
    cy.get('[data-cy="modal-component"]', { timeout: 10000 }).should("be.visible");

    cy.get('[data-cy="modal-component"]').within(() => {
      cy.contains(sel.githubEnabledBadge).should("be.visible");
      cy.get(sel.repoUrlInput).should("have.value", gitConfig.repoUrl);
      cy.get(sel.branchInput).should("have.value", gitConfig.branch);
    });

    cy.get(sel.modalClose).click();

    cy.log("[gitSync] ✓ Enabled badge and saved values verified");

    // Navigate to Dashboard — verify lock banner and branch header
    cy.get('[data-cy="icon-dashboard"]').click();
    cy.wait(1000);

    cy.get(sel.wsCurrentBranch, { timeout: 15000 }).should(
      "contain.text",
      gitConfig.branch,
    );
    cy.wait(2000)
    cy.get(sel.masterLockBanner).should("be.visible");
    cy.get(sel.masterLockBanner).should("contain.text", sel.lockBannerApps);
    cy.get(sel.wsGitPullBtn).should("be.visible");
    cy.get(sel.wsGitCommitBtn).should("not.exist");

    cy.log("[gitSync] ✓ Dashboard lock banner and branch header verified");

    // Branch popover — verify all elements
    cy.get(sel.wsBranchHeader).click();
    cy.get(sel.wsBranchPopover).should("be.visible");

    cy.get(sel.wsBranchPopover).within(() => {
      cy.contains(gitConfig.branch).should("be.visible");
      cy.contains(sel.branchPopoverDefaultBranch).should("be.visible");
      cy.contains(sel.branchPopoverUpdatedToday).should("be.visible");
      cy.contains(sel.branchPopoverFetchPRs).should("be.visible");
      cy.contains(sel.branchPopoverCreateNewBranch).should("be.visible");
      cy.contains(sel.branchPopoverSwitchBranch).should("be.visible");
    });

    cy.get("body").type("{esc}");
    cy.log("[gitSync] ✓ Branch popover elements verified");

    // Pull modal — verify content and cancel
    cy.get(sel.wsGitPullBtn).click();

    cy.get(sel.modalTitle).should("contain.text", sel.pullModalTitle);
    cy.contains(gitConfig.repoUrl).should("be.visible");
    cy.get(sel.checkForUpdatesLabel).should("be.visible");
    cy.get(sel.pullModalCancelBtn).should("be.visible");
    cy.get(sel.pullModalPullChangesBtn).should("be.visible");

    cy.get(sel.pullModalCancelBtn).click();
    cy.get(sel.modalTitle).should("not.exist");

    cy.log("[gitSync] ✓ Pull modal content verified");

    // Create branch modal — verify content and validation
    cy.get(sel.wsBranchHeader).click();
    cy.get(sel.wsBranchPopover).should("be.visible");
    cy.contains(sel.branchPopoverCreateNewBranch).click();

    cy.contains(sel.createBranchModalTitle).should("be.visible");
    cy.get(sel.branchNameInput).should("be.visible");
    cy.contains(sel.createBranchHelperText).should("be.visible");
    cy.contains(sel.createBranchCommitChanges).should("be.visible");
    cy.contains(sel.createBranchGitSyncNote).should("be.visible");
    cy.contains(sel.createBranchMasterOnly).should("be.visible");

    // Submit disabled with empty input
    cy.contains("button", sel.createBranchModalTitle).should("be.disabled");

    // Submit enabled after typing
    cy.get(sel.branchNameInput).type("temp-ui-test");
    cy.contains("button", sel.createBranchModalTitle).should("be.enabled");

    cy.contains("button", "Cancel").click();
    cy.get(sel.branchNameInput).should("not.exist");

    cy.log("[gitSync] ✓ Create branch modal content and validation verified");

    // Switch branch modal — verify content and search
    cy.get(sel.wsBranchHeader).click();
    cy.get(sel.wsBranchPopover).should("be.visible");
    cy.contains(sel.branchPopoverSwitchBranch).click();

    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").within(() => {
      cy.contains(sel.switchBranchModalTitle).should("be.visible");
      cy.contains(sel.switchBranchLockedMsg).should("be.visible");
      cy.contains(sel.switchBranchAllOpen).should("be.visible");
      cy.get(sel.switchBranchSearchInput).should("be.visible");
      cy.contains(gitConfig.branch).should("be.visible");
      cy.contains(sel.switchBranchViewInGit).should("be.visible");
      cy.contains(sel.switchBranchCreateNew).should("be.visible");
    });

    cy.get("body").type("{esc}");
    cy.log("[gitSync] ✓ Switch branch modal content and search verified");

    // Data Sources page — verify lock banner and branch popover
    cy.visit(`${Cypress.config("baseUrl")}/${Cypress.env("workspaceSlug")}/data-sources`);
    cy.wait(2000);

    cy.get(sel.wsCurrentBranch, { timeout: 15000 }).should(
      "contain.text",
      gitConfig.branch,
    );
    cy.get(sel.masterLockBanner).should("be.visible");
    cy.get(sel.masterLockBanner).should(
      "contain.text",
      sel.lockBannerDataSources,
    );
    cy.get(sel.wsGitPullBtn).should("be.visible");
    cy.get(sel.wsGitCommitBtn).should("not.exist");

    cy.get(sel.wsBranchHeader).click();
    cy.get(sel.wsBranchPopover).should("be.visible");

    cy.get(sel.wsBranchPopover).within(() => {
      cy.contains(gitConfig.branch).should("be.visible");
      cy.contains(sel.branchPopoverDefaultBranch).should("be.visible");
      cy.contains(sel.branchPopoverCreateNewBranch).should("be.visible");
      cy.contains(sel.branchPopoverSwitchBranch).should("be.visible");
    });

    cy.get("body").type("{esc}");
    cy.log("[gitSync] ✓ Data Sources lock banner and branch popover verified");

    // Delete config via UI
    cy.intercept("GET", "**/api/git-sync/**").as("gitSyncLoad");
    cy.visit(
      `${Cypress.config("baseUrl")}/${Cypress.env("workspaceSlug")}/workspace-settings/configure-git`,
    );
    cy.contains("Configure git sync", { timeout: 15000 }).should("be.visible");
    cy.wait("@gitSyncLoad");
    cy.wait(2000);

    cy.get('[data-cy="github-git-card"]').click();
    cy.get('[data-cy="modal-component"]', { timeout: 10000 }).should("be.visible");

    cy.get('[data-cy="modal-component"]').within(() => {
      cy.contains("GitHub").should("be.visible");
      cy.contains(sel.githubEnabledBadge).should("be.visible");
      cy.contains("button", sel.deleteConfigBtn).should("be.visible");
      cy.contains("button", sel.testConnectionBtn).should("be.visible");
    });

    cy.contains("button", sel.deleteConfigBtn).click();

    // Delete confirmation modal
    cy.contains(sel.deleteConfigModalTitle).should("be.visible");
    cy.contains(sel.deleteConfigModalMsg).should("be.visible");
    cy.get('[data-cy="cancel-button"]').should("be.visible");
    cy.get('[data-cy="yes-button"]').should("be.visible");

    cy.get('[data-cy="yes-button"]').click();

    cy.contains(sel.deleteConfigSuccessToast, { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get('[data-cy="github-toggle"]').should("not.be.checked");

    cy.log("[gitSync] ✓ Delete config flow verified");
  });

  it("Click on every app create option should show the create branch modal", () => {
    cy.gitSyncCheckAndConfigure();
    cy.gitSyncGoToDashboard();

    // On master the branch is locked — every app-creation entry point must
    cy.wait(2000)
    cy.get(sel.wsCurrentBranch, { timeout: 15000 }).should(
      "contain.text",
      "master",
    );
    cy.get(sel.masterLockBanner).should("be.visible");

    // Helper: assert "Switch branch" modal appears (locked master redirects here), then cancel it.
    const verifySwitchBranchModal = () => {
      cy.contains(sel.switchBranchModalTitle, { timeout: 10000 }).should(
        "be.visible",
      );
      cy.contains(sel.switchBranchLockedMsg).should("be.visible");
      cy.get(sel.switchBranchSearchInput).should("be.visible");
      cy.get("body").type("{esc}");
      cy.contains(sel.switchBranchModalTitle).should("not.exist");
    };

    // ── 1. "Create an app" main button ───────────────────────────────────────
    cy.get('[data-cy="create-new-apps-button"]').click();
    verifySwitchBranchModal();
    cy.log("[gitSync] ✓ Create an app → Switch branch modal verified");

    // ── 2. "Choose from template" dropdown item ───────────────────────────────
    cy.get('[data-cy="import-dropdown-menu"]').click();
    cy.get('[data-cy="choose-from-template-button"]')
      .should("be.visible")
      .click();
    verifySwitchBranchModal();
    cy.log("[gitSync] ✓ Choose from template → Switch branch modal verified");

    // ── 3. "Import from device" dropdown item ────────────────────────────────
    cy.get('[data-cy="import-dropdown-menu"]').click();
    cy.get('[data-cy="import-option-label"]').should("be.visible").click();
    verifySwitchBranchModal();
    cy.log("[gitSync] ✓ Import from device → Switch branch modal verified");

    // ── 4. "Import from git repository" dropdown item ────────────────────────
    // This option opens its own "Import app from git repository" modal (not the switch branch modal)
    cy.get('[data-cy="import-dropdown-menu"]').click();
    cy.get('[data-cy="import-from-git-button"]').should("be.visible").click();
    cy.contains("Import app from git repository", { timeout: 10000 }).should("be.visible");
    cy.contains("button", "Cancel").click();
    cy.contains("Import app from git repository").should("not.exist");
    cy.log("[gitSync] ✓ Import from git repository → Import modal verified");
  });
});
