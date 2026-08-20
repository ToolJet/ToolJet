import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { gitSyncSelectors as GS } from "Selectors/platform/gitsync";
import { viewAppCardOptions } from "Support/utils/common";
import {
  openAddToFolderModal,
  addAppsToMultiSelect,
  selectDestinationFolder,
} from "Support/utils/bulkMoveApps";

describe("Git Sync — Bulk Move Apps", { retries: 0 }, () => {
  let workspaceId, testId;
  let appNameA, appNameB, appNameC;
  let folderDestName, folderName;
  let appIdA, appIdB, appIdC, folderDestId;
  let masterBranchId;
  let setupBranchName;
  let featureBranchName = null;
  let extraBranchName = null;

  beforeEach(() => {
    featureBranchName = null;
    extraBranchName = null;
    masterBranchId = null;
    testId = Date.now();

    appNameA = `GS-AppA-${testId}`;
    appNameB = `GS-AppB-${testId}`;
    appNameC = `GS-AppC-${testId}`;
    folderDestName = `gs-folder-dest-${testId}`;
    folderName = `gs-iso-folder-${testId}`;
    setupBranchName = `gs-setup-${testId}`;

    cy.apiLogin();
    cy.viewport(1440, 1200);
    const wsName = `gs-bulk-${testId}`;
    cy.apiCreateWorkspace(wsName, wsName).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsName);
    });
    cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
    cy.gitSyncCheckAndConfigure();

    // Git Sync locks app creation on master. Create a setup branch, create apps
    // there, push to GitHub via UI (which waits for completion), merge to master
    // and pull so apps are visible on master.
    cy.gitSyncGoToDashboard();
    cy.gitSyncCreateBranchViaUI(setupBranchName);
    cy.gitSyncGetBranchId(setupBranchName).then((setupBranchId) => {
      cy.apiCreateAppOnBranch(appNameA, setupBranchId).then((app) => { appIdA = app.id; });
      cy.apiCreateAppOnBranch(appNameB, setupBranchId).then((app) => { appIdB = app.id; });
      cy.apiCreateAppOnBranch(appNameC, setupBranchId).then((app) => { appIdC = app.id; });
    });
    // Use UI push (with simBranch to reload gitSim cache) so the commit reaches GitHub before we proceed.
    cy.gitSyncDashboardPush(`initial: add apps for bulk-move tests [${testId}]`, setupBranchName);
    cy.gitSyncGetBranchId("master").then((id) => { masterBranchId = id; });
    cy.gitHubWaitForCommitsAhead(setupBranchName, "master");
    cy.gitHubCreatePR(setupBranchName, `Setup: add apps A/B/C [${testId}]`, "master")
      .then((pr) => cy.gitHubMergePR(pr));
    cy.then(() => cy.apiGitSyncPull(masterBranchId));
    cy.then(() => cy.apiSwitchBranch(masterBranchId));

    cy.apiCreateFolder(folderDestName, "front-end");
    cy.then(() => { folderDestId = Cypress.env("createdFolderId"); });
  });

  afterEach(() => {
    cy.then(() => { if (featureBranchName) cy.gitHubDeleteBranch(featureBranchName); });
    cy.then(() => { if (extraBranchName) cy.gitHubDeleteBranch(extraBranchName); });
    // setupBranchName is merged into master; the branch can be left for cleanup
    // by workspace archive, or explicitly deleted if it still exists remotely.
    cy.then(() => { if (setupBranchName) cy.gitHubDeleteBranch(setupBranchName); });
    cy.apiLogin();
    cy.apiArchiveWorkspace(workspaceId);
  });

  // ── Common Cases ──────────────────────────────────────────────────────────

  it("should move apps to a folder and remove them when git sync is enabled", () => {
    featureBranchName = `gs-move-${testId}`;
    const folderRemoveName = `gs-folder-remove-${testId}`;
    let branchId, folderRemoveId;

    cy.apiCreateFolder(folderRemoveName, "front-end");
    cy.then(() => { folderRemoveId = Cypress.env("createdFolderId"); });

    // Create feature branch (unlocks Add-to-folder)
    cy.gitSyncGoToDashboard();
    cy.gitSyncCreateBranchViaUI(featureBranchName);
    cy.gitSyncGetBranchId(featureBranchName).then((id) => { branchId = id; });

    // Pre-add appA to folderRemoveName on the branch for remove subtest
    cy.then(() => cy.apiAddAppToFolder(folderRemoveId, appIdA, branchId));

    // Remove appA from folderRemoveName via UI
    cy.gitSyncGoToDashboard();
    cy.get(dashboardSelector.folderName(folderRemoveName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
    viewAppCardOptions(appNameA);
    cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption)).click();
    cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appRemovedFromFolderTaost,
      false
    );
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );
    cy.get(commonSelectors.allApplicationsLink).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");

    // Bulk move appA + appB + appC to folderDestName
    openAddToFolderModal(appNameA);
    cy.get(dashboardSelector.updateFolderTitle).verifyVisibleElement(
      "have.text",
      dashboardText.updateFolderTitle
    );
    cy.get(dashboardSelector.moveAppText).should("be.visible");
    addAppsToMultiSelect(appNameB, appNameC);
    cy.get(dashboardSelector.moveAppText)
      .contains(dashboardText.nAppsSelected(3))
      .should("be.visible");
    selectDestinationFolder(folderDestName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderDestName),
      false
    );
    cy.get(dashboardSelector.folderName(folderDestName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
    cy.get(commonSelectors.appCard(appNameB)).should("be.visible");
    cy.get(commonSelectors.appCard(appNameC)).should("be.visible");
  });

  it("should validate modal state and support all bulk select options when git sync is enabled", () => {
    featureBranchName = `gs-modal-${testId}`;
    const folderXName = `gs-folder-x-${testId}`;
    const folderYName = `gs-folder-y-${testId}`;
    const appDupName = `GS-AppDup-${testId}`;
    const FOLDER_COUNT = 12;
    const scrollFolderNames = Array.from(
      { length: FOLDER_COUNT },
      (_, i) => `gs-scroll-folder-${i}-${testId}`
    );
    const APP_COUNT = 10;
    const pagedAppNames = Array.from(
      { length: APP_COUNT },
      (_, i) => `GS-PagedApp${i}-${testId}`
    );
    let folderXId, folderYId;

    cy.apiCreateFolder(folderXName, "front-end");
    cy.then(() => { folderXId = Cypress.env("createdFolderId"); });
    cy.apiCreateFolder(folderYName, "front-end");
    cy.then(() => { folderYId = Cypress.env("createdFolderId"); });
    scrollFolderNames.forEach((name) => cy.apiCreateFolder(name, "front-end"));

    // Create feature branch, then populate data
    // appDupName must be created after the feature branch exists (git sync blocks creation on master).
    cy.gitSyncGoToDashboard();
    cy.gitSyncCreateBranchViaUI(featureBranchName);
    cy.apiCreateApp(appDupName);
    cy.gitSyncGetBranchId(featureBranchName).then((branchId) => {
      pagedAppNames.forEach((name) => {
        cy.apiCreateApp(name);
        cy.then(() => cy.apiAddAppToFolder(folderXId, Cypress.env("appId"), branchId));
      });
      cy.then(() => {
        cy.apiAddAppToFolder(folderXId, appIdA, branchId);
        cy.apiAddAppToFolder(folderXId, Cypress.env("appId"), branchId);
        cy.apiAddAppToFolder(folderYId, Cypress.env("appId"), branchId);
      });
    });

    cy.gitSyncGoToDashboard();

    // Modal validation: button disabled until folder is selected
    openAddToFolderModal(appNameA);
    cy.get(dashboardSelector.addToFolderButton).should("be.disabled");
    selectDestinationFolder(folderDestName);
    cy.get(dashboardSelector.addToFolderButton).should("not.be.disabled");
    cy.get(dashboardSelector.appsMultiSelectValueRemove).first().click({ force: true });
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.selectFolderError,
      false
    );
    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    // Cancel does not move anything
    openAddToFolderModal(appNameA);
    addAppsToMultiSelect(appNameB);
    selectDestinationFolder(folderDestName);
    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(commonSelectors.toastMessage).should("not.exist");
    cy.get(dashboardSelector.folderName(folderDestName)).click();
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );

    // All apps (3) option
    cy.get(commonSelectors.allApplicationsLink).click();
    openAddToFolderModal(appNameA);
    cy.get(dashboardSelector.appsMultiSelectControl).click();
    cy.get(commonSelectors.folderList)
      .contains(dashboardText.allAppsOption(3))
      .should("be.visible")
      .click();
    cy.get(dashboardSelector.moveAppText)
      .contains(dashboardText.allAppsLabel)
      .should("be.visible");
    cy.get(commonSelectors.cancelButton).click();

    // All in this folder (10) option
    cy.get(dashboardSelector.folderName(folderXName)).click();
    openAddToFolderModal(pagedAppNames[0]);
    cy.get(dashboardSelector.appsMultiSelectControl).click();
    cy.get(commonSelectors.folderList).then(($list) => {
      expect($list.find(".react-select__option").length).to.be.greaterThan(9);
    });
    cy.get(commonSelectors.folderList)
      .contains(dashboardText.allInFolderOption(APP_COUNT))
      .should("be.visible");
    cy.get(commonSelectors.folderList).contains(pagedAppNames[1]).click();
    cy.get(commonSelectors.folderList).contains(pagedAppNames[2]).click();
    cy.get("body").type("{esc}");
    selectDestinationFolder(folderYName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderYName),
      false
    );

    // Duplicate skip
    cy.get(commonSelectors.allApplicationsLink).click();
    cy.get(dashboardSelector.folderName(folderXName)).click();
    openAddToFolderModal(appNameA);
    addAppsToMultiSelect(appDupName);
    cy.get("body").type("{esc}");
    selectDestinationFolder(folderYName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderYName),
      false
    );
    cy.get(dashboardSelector.folderName(folderYName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");

    // Scrollable folder list
    cy.get(commonSelectors.allApplicationsLink).click();
    openAddToFolderModal(appNameB);
    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).should("be.visible");
    const lastFolder = scrollFolderNames[FOLDER_COUNT - 1];
    cy.get(commonSelectors.folderList).scrollTo("bottom");
    cy.get(commonSelectors.folderList).contains(lastFolder).should("be.visible").click();
    cy.get(dashboardSelector.addToFolderButton).should("not.be.disabled").click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(lastFolder),
      false
    );
  });

  // ── Folder Guards ─────────────────────────────────────────────────────────

  it("should enforce folder guard rules for all folder types when git sync is enabled", () => {
    const feFolderName = `gs01-fe-folder-${testId}`;
    const modFolderName = `gs02-mod-folder-${testId}`;
    const wfFolderName = `gs04-wf-folder-${testId}`;
    const noGsFolderName = `gs03-no-gs-folder-${testId}`;

    cy.apiCreateFolder(feFolderName, "front-end");
    cy.apiCreateFolder(modFolderName, "module");
    cy.apiCreateFolder(wfFolderName, "workflow");
    cy.apiCreateFolder(noGsFolderName, "front-end");

    // Front-end folder: rename/delete options hidden
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(commonSelectors.folderListcard(feFolderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(feFolderName)).should("not.exist");
      });

    // Module folder: rename/delete options hidden
    cy.visit(`/${Cypress.env("workspaceSlug")}/modules`);
    cy.get(commonSelectors.folderListcard(modFolderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(modFolderName)).should("not.exist");
      });

    // Workflow folder: rename/delete options visible
    cy.visit(`/${Cypress.env("workspaceSlug")}/workflows`);
    cy.get(commonSelectors.folderListcard(wfFolderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(wfFolderName))
          .should("exist")
          .invoke("click");
      });
    cy.get(commonSelectors.editFolderOption(wfFolderName)).should("be.visible");
    cy.get(commonSelectors.deleteFolderOption(wfFolderName)).should("be.visible");
    cy.get("body").type("{esc}");

    // Disable git sync → front-end folder options restored
    cy.apiDeleteGitSync(workspaceId);
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(commonSelectors.folderListcard(noGsFolderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(noGsFolderName))
          .should("exist")
          .invoke("click");
      });
    cy.get(commonSelectors.editFolderOption(noGsFolderName))
      .should("be.visible")
      .and("have.text", commonText.editFolderOption);
    cy.get(commonSelectors.deleteFolderOption(noGsFolderName))
      .should("be.visible")
      .and("have.text", commonText.deleteFolderOption);
    cy.get(commonSelectors.editFolderOption(noGsFolderName)).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.folderListcard(noGsFolderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(noGsFolderName)).invoke("click");
      });
    cy.get(commonSelectors.deleteFolderOption(noGsFolderName)).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.cancelButton).click();
  });

  // ── Branch Isolation ──────────────────────────────────────────────────────

  it("should lock Add-to-folder on master and isolate assignments to the feature branch before merge (TC-GS-06, TC-GS-07)", () => {
    featureBranchName = `gs-iso-${testId}`;

    cy.gitSyncGoToDashboard();

    // Master: lock banner visible, Add-to-folder absent
    cy.get(GS.masterLockBanner).should("be.visible");
    viewAppCardOptions(appNameA);
    cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).should("not.exist");
    cy.get("body").type("{esc}");

    // Create feature branch → lock disappears, option available
    cy.gitSyncCreateBranchViaUI(featureBranchName);
    cy.get(GS.masterLockBanner).should("not.exist");
    viewAppCardOptions(appNameA);
    cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).should("be.visible");
    cy.get("body").type("{esc}");

    // Assign appA to folderName on feature branch
    openAddToFolderModal(appNameA);
    selectDestinationFolder(folderName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderName),
      false
    );

    // Feature branch: folder count = (1), appA visible inside
    cy.get(dashboardSelector.folderName(folderName)).should("contain.text", "(1)");
    cy.get(dashboardSelector.folderName(folderName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");

    // Switch to master: folder has no count, contents empty
    cy.gitSyncGoToDashboard();
    cy.gitSyncSwitchBranch("master");
    cy.get(dashboardSelector.folderName(folderName)).should("be.visible").and("not.contain.text", "(1)");
    cy.get(dashboardSelector.folderName(folderName)).click();
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );
  });

  it("should reflect correct folder counts on master after two sequential branch merges (TC-GS-18, TC-GS-19)", () => {
    // Branch 1 uses apiEditorPush (per-app commit) to assign App A + B → Folder A.
    // Branch 2 uses apiGitSyncPush (workspace commit) to assign App C → Folder A,
    // App D → Folder B. After each PR merge + pull we verify running folder counts
    // on master and confirm inter-branch isolation.

    const appNameD = `GS-AppD-${testId}`;
    const folderAName = `gs-iso-folder-a-${testId}`;
    const folderBName = `gs-iso-folder-b-${testId}`;
    featureBranchName = `gs-iso-b1-${testId}`;
    extraBranchName = `gs-iso-b2-${testId}`;

    let appIdD;
    let folderAId, folderBId;
    let branch1Id, branch2Id, masterBranchId;

    // appIdA/B/C populated by beforeEach (created before git sync was configured).
    cy.apiCreateFolder(folderAName, "front-end");
    cy.then(() => { folderAId = Cypress.env("createdFolderId"); });
    cy.apiCreateFolder(folderBName, "front-end");
    cy.then(() => { folderBId = Cypress.env("createdFolderId"); });
    cy.gitSyncGetBranchId("master").then((id) => { masterBranchId = id; });

    // Branch 1: assign A + B → Folder A, commit per-app via apiEditorPush
    cy.gitSyncCreateBranchViaApi(featureBranchName);
    cy.gitSyncGetBranchId(featureBranchName).then((id) => { branch1Id = id; });

    cy.then(() => cy.apiAddAppToFolder(folderAId, appIdA, branch1Id));
    cy.then(() =>
      cy.apiGetEditingVersionId(appIdA, branch1Id).then((vid) =>
        cy.apiEditorPush(appIdA, vid, `assign ${appNameA} to ${folderAName}`, featureBranchName, appNameA)
      )
    );
    cy.then(() => cy.apiAddAppToFolder(folderAId, appIdB, branch1Id));
    cy.then(() =>
      cy.apiGetEditingVersionId(appIdB, branch1Id).then((vid) =>
        cy.apiEditorPush(appIdB, vid, `assign ${appNameB} to ${folderAName}`, featureBranchName, appNameB)
      )
    );

    cy.gitHubAssertAppInFolder(featureBranchName, folderAName, appNameA);
    cy.gitHubAssertAppInFolder(featureBranchName, folderAName, appNameB);

    // Master: both folders empty before PR 1 is merged
    cy.then(() => cy.apiSwitchBranch(masterBranchId));
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(dashboardSelector.folderName(folderAName)).should("be.visible").and("not.contain.text", "(");
    cy.get(dashboardSelector.folderName(folderBName)).should("be.visible").and("not.contain.text", "(");

    cy.gitHubWaitForCommitsAhead(featureBranchName, "master");
    cy.gitHubCreatePR(featureBranchName, `PR1: assign A+B to ${folderAName} [${testId}]`, "master")
      .then((pr1) => cy.gitHubMergePR(pr1));

    cy.then(() => cy.apiGitSyncPull(masterBranchId));
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);

    // Folder A = (2); Folder B still empty
    cy.get(dashboardSelector.folderName(folderAName)).should("contain.text", "(2)");
    cy.get(dashboardSelector.folderName(folderBName)).should("be.visible").and("not.contain.text", "(");

    // Open Folder A: App A visible, App C not yet merged
    cy.get(dashboardSelector.folderName(folderAName)).click();
    cy.get(commonSelectors.homePageSearchBar).clear().type(appNameA);
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
    cy.get(commonSelectors.homePageSearchBar).clear().type(appNameC);
    cy.get(commonSelectors.appCard(appNameC)).should("not.exist");
    cy.get(commonSelectors.allApplicationsLink).click();

    // Branch 2: assign C → Folder A, D → Folder B, commit workspace
    cy.gitSyncCreateBranchViaApi(extraBranchName);
    cy.gitSyncGetBranchId(extraBranchName).then((id) => { branch2Id = id; });
    // appNameD is unique to this test; create it now that branch2 exists.
    cy.then(() => cy.apiCreateAppOnBranch(appNameD, branch2Id).then((app) => { appIdD = app.id; }));

    cy.then(() => cy.apiAddAppToFolder(folderAId, appIdC, branch2Id));
    cy.then(() => cy.apiGitSyncPush(`assign ${appNameC} to ${folderAName}`, branch2Id));
    cy.then(() => cy.apiAddAppToFolder(folderBId, appIdD, branch2Id));
    cy.then(() => cy.apiGitSyncPush(`assign ${appNameD} to ${folderBName}`, branch2Id));

    cy.gitHubAssertAppInFolder(extraBranchName, folderAName, appNameC);
    cy.gitHubAssertAppInFolder(extraBranchName, folderBName, appNameD);

    cy.gitHubWaitForCommitsAhead(extraBranchName, "master");
    cy.gitHubCreatePR(extraBranchName, `PR2: assign C+D to folders [${testId}]`, "master")
      .then((pr2) => cy.gitHubMergePR(pr2));

    cy.then(() => cy.apiGitSyncPull(masterBranchId));
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);

    // Folder A = 3, Folder B = 1
    cy.get(dashboardSelector.folderName(folderAName)).should("contain.text", "(3)");
    cy.get(dashboardSelector.folderName(folderBName)).should("contain.text", "(1)");

    // Master: lock banner active, Add-to-folder absent
    cy.get(GS.masterLockBanner).should("be.visible");
    viewAppCardOptions(appNameA);
    cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).should("not.exist");
    cy.get("body").type("{esc}");
  });

  it("should show folder assignment on master after feature branch is merged and pulled (TC-GS-10, TC-GS-16, TC-GS-17)", () => {
    featureBranchName = `gs-iso-${testId}`;

    cy.gitSyncGoToDashboard();
    cy.gitSyncCreateBranchViaUI(featureBranchName);

    openAddToFolderModal(appNameA);
    selectDestinationFolder(folderName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderName),
      false
    );

    cy.gitSyncDashboardPush(`feat: move ${appNameA} to folder [${testId}]`);
    cy.gitHubWaitForCommitsAhead(featureBranchName, "master");
    cy.gitHubCreatePR(featureBranchName, `PR: folder move ${testId}`, "master").then((pr) =>
      cy.gitHubMergePR(pr)
    );

    cy.gitSyncGoToDashboard();
    cy.gitSyncSwitchBranch("master");
    cy.get(GS.wsGitPullBtn).click();
    cy.get(GS.modalTitle).should("be.visible");
    cy.get(GS.checkForUpdatesLabel).click();
    cy.get(GS.pullModalPullChangesBtn, { timeout: 30000 }).should("be.enabled").click();
    cy.get(GS.modalTitle, { timeout: 45000 }).should("not.exist");

    cy.gitSyncGoToDashboard();
    cy.get(dashboardSelector.folderName(folderName)).should("contain.text", "(1)");
    cy.get(dashboardSelector.folderName(folderName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
  });

  // ── Workflow Folders ──────────────────────────────────────────────────────

  it("should keep workflow folder assignment instance-wide regardless of git branch (TC-WF-01, TC-WF-02)", () => {
    featureBranchName = `gs-wf-branch-${testId}`;
    const wfName = `GS-Wf-${testId}`;
    const wfFolderName = `gs-wf-folder-${testId}`;
    let wfFolderId;

    cy.apiCreateWorkflow(wfName);
    cy.apiCreateFolder(wfFolderName, "workflow");
    cy.then(() => { wfFolderId = Cypress.env("createdFolderId"); });
    cy.then(() => { cy.apiAddAppToFolder(wfFolderId, Cypress.env("workflowId")); });

    cy.visit(`/${Cypress.env("workspaceSlug")}/workflows`);
    cy.get(dashboardSelector.folderName(wfFolderName)).should("contain.text", "(1)");

    cy.gitSyncGoToDashboard();
    cy.gitSyncCreateBranchViaUI(featureBranchName);

    cy.visit(`/${Cypress.env("workspaceSlug")}/workflows`);
    cy.get(dashboardSelector.folderName(wfFolderName)).should("contain.text", "(1)");

    cy.gitSyncGoToDashboard();
    cy.gitSyncSwitchBranch("master");
    cy.visit(`/${Cypress.env("workspaceSlug")}/workflows`);
    cy.get(dashboardSelector.folderName(wfFolderName)).should("contain.text", "(1)");
  });
});
