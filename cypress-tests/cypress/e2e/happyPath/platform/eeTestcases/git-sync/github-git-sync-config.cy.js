import { fake } from "Fixtures/fake";
import { gitSyncSelectors as sel } from "Selectors/platform/gitsync";

describe("GitHub Git Sync", { baseUrl: null }, () => {
  const appHost = "http://localhost:8082";

  const gitConfig = {
    repoUrl: "https://github.com/ajith-k-v/git_sync_branching.git",
    branch: "master",
    appId: "1571896",
    installationId: "75191473",
    privateKey: Cypress.env("GITHUB_PRIVATE_KEY"),
  };

  beforeEach(() => {
    cy.viewport(1800, 1400);
  });

  // ─── Shared helpers ─────────────────────────────────────────────────────────

  const fillGitHubForm = () => {
    cy.get(sel.repoUrlInput).clear().type(gitConfig.repoUrl);
    cy.get(sel.branchInput).clear().type(gitConfig.branch);
    cy.get(sel.appIdInput).clear().type(gitConfig.appId);
    cy.get(sel.installationIdInput).clear().type(gitConfig.installationId);
    cy.get(sel.privateKeyInput).clear().type(gitConfig.privateKey, { delay: 0 });
  };

  /** Header: branch badge + Pull button + lock banner */
  const verifyGitSyncHeader = (lockText) => {
    cy.get(sel.wsCurrentBranch, { timeout: 15000 }).should("contain.text", gitConfig.branch);
    cy.contains("button", sel.pullBtn).should("be.visible");
    cy.get(sel.masterLockBanner).should("be.visible");
    cy.contains(lockText).should("be.visible");
  };

  /** Branch popover */
  const verifyBranchPopover = () => {
    cy.get(sel.wsBranchPopover).should("be.visible");
    cy.contains(sel.branchPopoverDefaultBranch).should("be.visible");
    cy.contains(sel.branchPopoverUpdatedToday).should("be.visible");
    cy.contains(sel.branchPopoverFetchPRs).should("be.visible");
    cy.contains(sel.branchPopoverCreateNewBranch).should("be.visible");
    cy.contains(sel.branchPopoverSwitchBranch).should("be.visible");
  };

  /** Pull Commit modal */
  const verifyPullModal = () => {
    cy.get(sel.modalTitle).should("contain.text", sel.pullModalTitle);
    cy.contains(gitConfig.repoUrl).should("be.visible");
    cy.get(sel.checkForUpdatesLabel).should("be.visible");
    cy.get(sel.pullModalCancelBtn).should("be.visible");
    cy.get(sel.pullModalPullChangesBtn).should("be.visible");
  };

  /** Create branch modal */
  const verifyCreateBranchModal = () => {
    cy.contains(sel.createBranchModalTitle).should("be.visible");
    cy.get(sel.createBranchInput).should("be.visible");
    cy.contains(sel.createBranchHelperText).should("be.visible");
    cy.contains(sel.createBranchCommitChanges).should("be.visible");
    cy.contains(sel.createBranchGitSyncNote).should("be.visible");
    cy.contains(sel.createBranchMasterOnly).should("be.visible");
    cy.contains("button", sel.createBranchModalTitle).should("be.disabled");
    cy.contains("button", "Cancel").should("be.visible");
  };

  /** Switch branch modal */
  const verifySwitchBranchModal = () => {
    cy.get("[role='dialog']").should("be.visible");
    cy.get("[role='dialog']").within(() => {
      cy.contains(sel.switchBranchModalTitle).should("be.visible");
      cy.contains(sel.switchBranchLockedMsg).should("be.visible");
      cy.contains(sel.switchBranchAllOpen).should("be.visible");
      cy.get(sel.switchBranchSearchInput).should("be.visible");
      cy.contains(gitConfig.branch).should("be.visible");
      cy.contains(sel.switchBranchDefaultLabel).should("be.visible");
      cy.contains(sel.switchBranchCreatedBy).should("be.visible");
      cy.contains(sel.switchBranchViewInGit).should("be.visible");
      cy.contains(sel.switchBranchCreateNew).should("be.visible");
    });
  };

  /**
   * UI delete flow.
   * Expects the configure-git page to be visited fresh.
   * Opens the GitHub modal, verifies enabled state, clicks Delete config,
   * verifies confirmation modal, confirms, verifies success toast.
   *
   * @param {string} wsSlug - workspace slug
   */
  const verifyUIDeleteFlow = (wsSlug) => {
    cy.intercept("GET", "**/api/git-sync/**").as("gitSyncLoad");
    cy.visit(`${appHost}/${wsSlug}/workspace-settings/configure-git`);
    cy.contains("Configure git sync", { timeout: 15000 }).should("be.visible");
    cy.wait("@gitSyncLoad");
    cy.wait(2000);

    // Open GitHub modal — should show Enabled state
    cy.get('[data-cy="github-git-card"]').click();
    cy.get('[data-cy="modal-component"]', { timeout: 10000 }).should("be.visible");

    cy.get('[data-cy="modal-component"]').within(() => {
      cy.contains("GitHub").should("be.visible");
      cy.contains(sel.githubEnabledBadge).should("be.visible");
      cy.get(sel.repoUrlInput).should("have.value", gitConfig.repoUrl);
      cy.get(sel.branchInput).should("have.value", gitConfig.branch);
      cy.contains("button", sel.deleteConfigBtn).should("be.visible");
      cy.contains("button", sel.testConnectionBtn).should("be.visible");
    });

    // Click Delete config
    cy.contains("button", sel.deleteConfigBtn).click();

    // Delete confirmation modal
    cy.contains(sel.deleteConfigModalTitle).should("be.visible");
    cy.contains(sel.deleteConfigModalMsg).should("be.visible");
    cy.get('[data-cy="cancel-button"]').should("be.visible");
    cy.get('[data-cy="yes-button"]').should("be.visible");

    // Confirm deletion
    cy.get('[data-cy="yes-button"]').click();

    // Success toast
    cy.contains(sel.deleteConfigSuccessToast, { timeout: 10000 }).should("be.visible");

    // GitHub toggle should be OFF
    cy.get('[data-cy="github-toggle"]').should("not.be.checked");
  };

  // ─── it 1: Create workspace → UI config → verify modals → UI delete → archive

  it("should create workspace, configure GitHub git sync via UI, verify all modals on Dashboard and Data Sources, delete config via UI, then archive workspace", () => {
    const wsName = `gitsync-${fake.firstName.toLowerCase()}`;
    const wsSlug = wsName;
    let createdWorkspaceId;

    // Step 1: Create a fresh workspace via API
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      createdWorkspaceId = res.body.organization_id;
    });

    // Step 2: Open Configure git sync page
    // Intercept the componentDidMount git-sync fetch so we can wait for it before clicking
    cy.intercept("GET", "**/api/git-sync/**").as("gitSyncInit");
    cy.visit(`${appHost}/${wsSlug}/workspace-settings/configure-git`);
    cy.wait(3000);
    cy.contains("Configure git sync", { timeout: 15000 }).should("be.visible");
    cy.wait("@gitSyncInit"); // ensure componentDidMount has finished before clicking

    // Step 3: Open GitHub modal — verify Disabled initial state
    cy.wait(2000);
    cy.get('[data-cy="github-git-card"]', { timeout: 30000 }).should("be.visible").click();
    cy.get('[data-cy="modal-component"]', { timeout: 30000 }).should("be.visible");
    cy.get('[data-cy="modal-component"]').within(() => {
      cy.contains("GitHub").should("be.visible");
      cy.contains(sel.githubDisabledBadge).should("be.visible");
    });

    // Step 4: Fill form
    fillGitHubForm();

    // Step 5: Test connection (real API)
    cy.wait(1000)
    cy.contains("button", sel.testConnectionBtn).click();
    cy.contains("button", sel.saveConfigBtn, { timeout: 15000 }).should("not.be.disabled");

    // Step 6: Save config
    cy.contains("button", sel.saveConfigBtn).click();
    cy.get('[data-cy="modal-component"]').should("not.exist");

    // GitHub toggle ON on configure-git page
    cy.get('[data-cy="github-toggle"]').should("be.checked");

    // ── Dashboard ─────────────────────────────────────────────────────────────

    cy.get('[data-cy="icon-dashboard"]').click();
    cy.wait(500)

    // Step 7: Header git sync items

    verifyGitSyncHeader(sel.lockBannerApps);

    // Step 8: Branch popover
    cy.get(sel.wsBranchHeader).click();
    verifyBranchPopover();
    cy.get("body").type("{esc}");

    // Step 9: Pull Commit modal
    cy.contains("button", sel.pullBtn).click();
    verifyPullModal();
    cy.get(sel.pullModalCancelBtn).click();

    // Step 10: Create branch modal
    cy.get(sel.wsBranchHeader).click();
    cy.contains(sel.branchPopoverCreateNewBranch).click();
    verifyCreateBranchModal();
    cy.contains("button", "Cancel").click();

    // Step 11: Switch branch modal
    cy.get(sel.wsBranchHeader).click();
    cy.contains(sel.branchPopoverSwitchBranch).click();
    verifySwitchBranchModal();
    cy.get("body").type("{esc}");

    // ── Data Sources ──────────────────────────────────────────────────────────

    cy.visit(`${appHost}/${wsSlug}/data-sources`);

    // Step 12: Header git sync items
    verifyGitSyncHeader(sel.lockBannerDataSources);

    // Step 13: Branch popover on Data Sources
    cy.get(sel.wsBranchHeader).click();
    verifyBranchPopover();
    cy.get("body").type("{esc}");

    // ── UI Delete ─────────────────────────────────────────────────────────────

    // Step 14: Delete git sync config via UI
    verifyUIDeleteFlow(wsSlug);

    // ── Archive workspace ─────────────────────────────────────────────────────

    // Step 15: Archive the test workspace
    cy.then(() => cy.apiArchiveWorkspace(createdWorkspaceId));
  });

  // ─── it 2: API config → verify Dashboard + Data Sources → API delete ─────────

  it("should configure GitHub git sync via API, verify Dashboard and Data Sources UI, then delete config via API", () => {
    cy.apiLogin();

    cy.apiGetDefaultWorkspace().then((ws) => {
      const wsSlug = ws.slug;
      const wsId = ws.id;

      // Step 1: Configure git sync via API
      cy.apiConfigureGitSync(gitConfig).then(() => {

        // ── Dashboard ───────────────────────────────────────────────────────────

        cy.visit(`${appHost}/${wsSlug}`);

        // Step 2: Header git sync items
        verifyGitSyncHeader(sel.lockBannerApps);

        // Step 3: Branch popover
        cy.get(sel.wsBranchHeader).click();
        verifyBranchPopover();
        cy.get("body").type("{esc}");

        // Step 4: Pull Commit modal
        cy.contains("button", sel.pullBtn).click();
        verifyPullModal();
        cy.get(sel.pullModalCancelBtn).click();

        // Step 5: Create branch modal
        cy.get(sel.wsBranchHeader).click();
        cy.contains(sel.branchPopoverCreateNewBranch).click();
        verifyCreateBranchModal();
        cy.contains("button", "Cancel").click();

        // Step 6: Switch branch modal
        cy.get(sel.wsBranchHeader).click();
        cy.contains(sel.branchPopoverSwitchBranch).click();
        verifySwitchBranchModal();
        cy.get("body").type("{esc}");

        // ── Data Sources ─────────────────────────────────────────────────────────

        cy.visit(`${appHost}/${wsSlug}/data-sources`);

        // Step 7: Header git sync items
        verifyGitSyncHeader(sel.lockBannerDataSources);

        // Step 8: Branch popover on Data Sources
        cy.get(sel.wsBranchHeader).click();
        verifyBranchPopover();
        cy.get("body").type("{esc}");

        // ── API Delete ────────────────────────────────────────────────────────────

        // Step 9: Delete git sync config via API
        cy.apiDeleteGitSync(wsId);
      });
    });
  });
});
