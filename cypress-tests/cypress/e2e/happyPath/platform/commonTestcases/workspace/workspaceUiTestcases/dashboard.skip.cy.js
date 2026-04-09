import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import {
  createFolder,
  deleteDownloadsFolder,
  deleteFolder,
  logout,
  openFolderDropdown,
  selectFolderFromDropdown,
} from "Support/utils/common";
import {
  deleteApp,
  modifyAndVerifyAppCardIcon,
  verifyAppCardOptions,
  verifyAppCrudOperations,
  verifyCloneApp,
  verifyContentTabs,
  verifyCreateFolderDialog,
  verifyEmptyState,
  verifyExportApp,
  verifyFolderAddAndRemove,
  verifyFolderBreadcrumb,
  verifyFolderDeleteDialog,
  verifyFolderEditAndRename,
  verifyFolderEmptyState,
  verifyImportDropdown,
  verifyModeToggle,
  verifyNotificationsPanel,
  verifyPagination,
  verifyRenameAndCleanup,
  verifyRenameAppDialog,
  verifySettingsMenu,
  verifySidebarIcons,
  verifyTopBar,
} from "Support/utils/dashboard";


describe("dashboard", () => {
  let data = {};

  beforeEach(() => {
    data = {
      appName: `${fake.companyName}-App`,
      folderName: `${fake.companyName.toLowerCase()}-folder`,
      cloneAppName: `cloned-${fake.companyName}-App`,
      updatedFolderName: `new-${fake.companyName.toLowerCase()}-folder`,
    };
    cy.intercept("GET", "/api/library_apps").as("appLibrary");
    cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
    deleteDownloadsFolder();
    cy.apiLogin();
    cy.viewport(1440, 1200);
  });

  it("should verify the elements on empty dashboard", () => {
    cy.intercept("GET", "/api/apps*", {
      fixture: 'intercept/emptyDashboard.json'
    }).as("dashboardPage");

    cy.intercept("GET", "/api/metadata", {
      body: {
        installed_version: "2.9.2",
        version_ignored: false,
      },
    }).as("version");

    cy.visit("/my-workspace");

    verifyTopBar();

    verifyFolderBreadcrumb();

    verifyContentTabs();

    verifyNotificationsPanel();

    verifyModeToggle();

    verifySettingsMenu("2.9.2");

    verifyEmptyState();

    verifyImportDropdown();

    verifyPagination();

    verifySidebarIcons();
  });

  it("Should verify app card elements and app card operations", () => {
    cy.exec("mkdir -p ./cypress/downloads/");
    cy.exec("cd ./cypress/downloads/ && rm -rf '*'");

    const renamedAppName = `${data.appName}-Renamed`;
    cy.apiCreateApp(data.appName);
    cy.visit("/my-workspace");

    cy.get(commonSelectors.appCreationDetails).first().should("be.visible");
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.appName)).should("be.visible");
    cy.get(commonSelectors.appTitle(data.appName)).first().should("have.text", data.appName);

    verifyAppCardOptions(data.appName);

    verifyRenameAppDialog(data.appName, renamedAppName);

    modifyAndVerifyAppCardIcon(data.appName);

    createFolder(data.folderName);

    verifyFolderAddAndRemove(data.appName, data.folderName);

    verifyExportApp(data.appName);

    verifyCloneApp(data.appName, data.cloneAppName);

    verifyRenameAndCleanup(data.appName, renamedAppName);
  });

  it("Should verify the app CRUD operation", () => {
    cy.visit("/my-workspace");
    cy.wait(2000);
    verifyAppCrudOperations(data.appName);
  });

  it("Should verify the folder CRUD operation", () => {
    cy.visit("/my-workspace");
    cy.apiCreateApp(data.appName);

    verifyCreateFolderDialog(data.folderName);

    verifyFolderEmptyState(data.folderName);

    verifyFolderEditAndRename(data.folderName, data.updatedFolderName);

    verifyFolderDeleteDialog(data.updatedFolderName);

    deleteFolder(data.updatedFolderName);

    openFolderDropdown();
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should("not.exist");
    cy.wait(2000);
    selectFolderFromDropdown("all applications");
    deleteApp(data.appName);

    cy.get(commonSelectors.appCard(data.appName)).should("not.exist");
    logout();
  });
});
