import { fake } from "Fixtures/fake";
import {
  createFolder,
  deleteFolder,
  navigateToAppEditor,
  viewAppCardOptions,
  verifyModal,
  verifyConfirmationModal,
  viewFolderCardOptions,
  closeModal,
  cancelModal,
  verifyTooltip,
} from "Support/utils/common";
import {
  modifyAndVerifyAppCardIcon,
  verifyAppDelete,
} from "Support/utils/dashboard";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import { logout } from "Support/utils/common";

describe("dashboard", () => {
  let data = {};

  beforeEach(() => {
    data = {
      appName: `${fake.companyName}-App`,
      folderName: `${fake.companyName.toLowerCase()}-folder`,
      cloneAppName: `cloned-${fake.companyName}-App`,
      updatedFolderName: `new-${fake.companyName.toLowerCase()}-folder`,
      workspaceName: fake.firstName,
      workspaceSlug: fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };
    cy.intercept("GET", "/api/library_apps").as("appLibrary");
    cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
    cy.skipWalkthrough();

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(`${data.workspaceSlug}`);
  });

  // it("Should verify app card elements and app card operations", () => {
  //   const customLayout = {
  //     desktop: { top: 100, left: 20 },
  //     mobile: { width: 8, height: 50 },
  //   };

  //   cy.apiCreateApp(data.appName);
  //   cy.visit(`${data.workspaceSlug}`);

  //   cy.wait(2000);
  //   cy.get(commonSelectors.appCreationDetails).should("be.visible");
  //   cy.get(commonSelectors.appCard(data.appName)).should("be.visible");
  //   cy.get(commonSelectors.appTitle(data.appName)).verifyVisibleElement(
  //     "have.text",
  //     data.appName
  //   );

  //   viewAppCardOptions(data.appName);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.changeIconOption)
  //   ).verifyVisibleElement("have.text", commonText.changeIconOption);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.addToFolderOption)
  //   ).verifyVisibleElement("have.text", commonText.addToFolderOption);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.cloneAppOption)
  //   ).verifyVisibleElement("have.text", commonText.cloneAppOption);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.exportAppOption)
  //   ).verifyVisibleElement("have.text", commonText.exportAppOption);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.deleteAppOption)
  //   ).verifyVisibleElement("have.text", commonText.deleteAppOption);

  //   modifyAndVerifyAppCardIcon(data.appName);
  //   createFolder(data.folderName);

  //   viewAppCardOptions(data.appName);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.addToFolderOption)
  //   ).click();
  //   verifyModal(
  //     dashboardText.addToFolderTitle,
  //     dashboardText.addToFolderButton,
  //     dashboardSelector.selectFolder
  //   );
  //   cy.get(dashboardSelector.moveAppText).verifyVisibleElement(
  //     "have.text",
  //     dashboardText.moveAppText(data.appName)
  //   );

  //   cy.get(dashboardSelector.selectFolder).click();
  //   cy.get(commonSelectors.folderList).contains(data.folderName).click();
  //   cy.get(dashboardSelector.addToFolderButton).click();
  //   cy.verifyToastMessage(
  //     commonSelectors.toastMessage,
  //     commonText.AddedToFolderToast,
  //     false
  //   );

  //   cy.get(dashboardSelector.folderName(data.folderName)).verifyVisibleElement(
  //     "have.text",
  //     dashboardText.folderName(`${data.folderName} (1)`)
  //   );

  //   cy.get(dashboardSelector.folderName(data.folderName)).click();
  //   cy.get(commonSelectors.appCard(data.appName))
  //     .contains(data.appName)
  //     .should("be.visible");

  //   viewAppCardOptions(data.appName);

  //   cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption))
  //     .verifyVisibleElement("have.text", commonText.removeFromFolderOption)
  //     .click();
  //   verifyConfirmationModal(commonText.appRemovedFromFolderMessage);

  //   cancelModal(commonText.cancelButton);

  //   viewAppCardOptions(data.appName);
  //   cy.get(
  //     commonSelectors.appCardOptions(commonText.removeFromFolderOption)
  //   ).click();
  //   cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  //   cy.verifyToastMessage(
  //     commonSelectors.toastMessage,
  //     commonText.appRemovedFromFolderTaost,
  //     false
  //   );
  //   cy.get(commonSelectors.modalComponent).should("not.exist");
  //   cy.get(commonSelectors.empytyFolderImage).should("be.visible");
  //   cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
  //     "have.text",
  //     commonText.emptyFolderText
  //   );
  //   cy.get(commonSelectors.allApplicationsLink).click();
  //   deleteFolder(data.folderName);

  //   cy.get(commonSelectors.allApplicationsLink).click();

  //   cy.wait(1000);
  //   viewAppCardOptions(data.appName);
  //   cy.wait(2000);
  //   cy.get(commonSelectors.appCardOptions(commonText.exportAppOption)).click();
  //   cy.get(commonSelectors.exportAllButton).click();

  //   cy.exec("ls ./cypress/downloads/").then((result) => {
  //     const downloadedAppExportFileName = result.stdout.split("\n")[0];
  //     expect(downloadedAppExportFileName).to.contain.string("app");
  //   });

  //   viewAppCardOptions(data.appName);
  //   cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
  //   cy.get('[data-cy="clone-app"]').click();
  //   cy.get(".go3958317564")
  //     .should("be.visible")
  //     .and("have.text", dashboardText.appClonedToast);
  //   cy.wait(3000);

  //   cy.renameApp(data.cloneAppName);
  //   cy.apiAddComponentToApp(data.cloneAppName, "button", 25, 25);
  //   cy.backToApps();
  //   cy.wait("@appLibrary");
  //   cy.wait(1000);

  //   cy.get(commonSelectors.appCard(data.cloneAppName)).should("be.visible");

  //   cy.wait(1000);

  //   viewAppCardOptions(data.cloneAppName);
  //   cy.get(commonSelectors.deleteAppOption).click();
  //   cy.get(commonSelectors.modalMessage).verifyVisibleElement(
  //     "have.text",
  //     commonText.deleteAppModalMessage(data.cloneAppName)
  //   );
  //   cy.get(
  //     commonSelectors.buttonSelector(commonText.cancelButton)
  //   ).verifyVisibleElement("have.text", commonText.cancelButton);
  //   cy.get(
  //     commonSelectors.buttonSelector(commonText.modalYesButton)
  //   ).verifyVisibleElement("have.text", commonText.modalYesButton);
  //   cancelModal(commonText.cancelButton);

  //   viewAppCardOptions(data.cloneAppName);
  //   cy.get(commonSelectors.deleteAppOption).click();
  //   cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  //   cy.verifyToastMessage(
  //     commonSelectors.toastMessage,
  //     commonText.appDeletedToast,
  //     false
  //   );
  //   verifyAppDelete(data.cloneAppName);
  //   cy.wait("@appLibrary");

  //   cy.deleteApp(data.appName);
  //   verifyAppDelete(data.appName);
  // });

  it("should verify the elements on empty dashboard", () => {
    cy.intercept("GET", "/api/metadata", {
      body: {
        installed_version: "2.9.2",
        version_ignored: false,
      },
    }).as("version");

    cy.get(commonSelectors.homePageLogo).should("be.visible");
    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      data.workspaceName
    );
    cy.get(commonSelectors.workspaceName).click();
    // cy.get(commonSelectors.editRectangleIcon).should("be.visible");
    cy.get(commonSelectors.appCreateButton).verifyVisibleElement(
      "have.text",
      "Create an app"
    );
    cy.get(dashboardSelector.folderLabel).should("be.visible");
    cy.get(dashboardSelector.folderLabel).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Folders");
    });
    cy.get(commonSelectors.createNewFolderButton).should("be.visible");
    cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
      "have.text",
      commonText.allApplicationsLink
    );

    cy.get(commonSelectors.notificationsIcon).should("be.visible").click();
    cy.get(commonSelectors.notificationsCard).should("be.visible");
    cy.get(commonSelectors.notificationsCardTitle).verifyVisibleElement(
      "have.text",
      commonText.notificationsCardTitle
    );
    cy.get(commonSelectors.emptyNotificationIcon).should("be.visible");
    cy.get(commonSelectors.emptyNotificationTitle).verifyVisibleElement(
      "have.text",
      commonText.emptyNotificationTitle
    );
    cy.get(commonSelectors.emptyNotificationSubtitle)
      .should("be.visible")
      .and(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          commonText.emptyNotificationSubtitle
        );
      });
    cy.get(commonSelectors.notificationsCardFooter).verifyVisibleElement(
      "have.text",
      commonText.viewReadNotifications
    );

    cy.get(dashboardSelector.modeToggle).should("be.visible").click();
    cy.get(commonSelectors.mainWrapper)
      .should("have.attr", "class")
      .and("contain", "theme-dark");
    cy.get(dashboardSelector.modeToggle).click();
    cy.get(dashboardSelector.homePageContent)
      .should("have.attr", "class")
      .and("contain", "bg-light-gray");

    cy.wait(500);
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonSelectors.marketplaceOption).verifyVisibleElement(
      "have.text",
      "Marketplace"
    );
    cy.get(commonSelectors.workspaceSettings).verifyVisibleElement(
      "have.text",
      "Workspace settings"
    );
    cy.get(commonSelectors.profileSettings).verifyVisibleElement(
      "have.text",
      "Profile settings"
    );
    cy.get(commonSelectors.logoutLink).verifyVisibleElement(
      "have.text",
      commonText.logoutLink
    );

    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.breadcrumbApplications
      );
    });
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      dashboardText.dashboardAppsHeaderLabel
    );

    cy.get(dashboardSelector.versionLabel).verifyVisibleElement(
      "have.text",
      "Version 2.9.2"
    );
    cy.get(dashboardSelector.emptyPageImage).should("be.visible");
    cy.get(dashboardSelector.emptyPageHeader).verifyVisibleElement(
      "have.text",
      dashboardText.emptyPageHeader
    );
    cy.get(dashboardSelector.emptyPageDescription).verifyVisibleElement(
      "have.text",
      dashboardText.emptyPageDescription
    );
    cy.get(dashboardSelector.dashboardAppCreateButton).verifyVisibleElement(
      "have.text",
      dashboardText.createAppButton
    );
    cy.get(dashboardSelector.importAppButton).should("be.visible");
    cy.get(dashboardSelector.importAppButton)
      .invoke("text")
      .then((text) => {
        expect(text.trim()).equal(dashboardText.importAppButton);
      });

    cy.get(dashboardSelector.appTemplateRow).should("be.visible");
    cy.reload();
    verifyTooltip(commonSelectors.dashboardIcon, "Apps");
    verifyTooltip(commonSelectors.databaseIcon, "ToolJet Database");
    verifyTooltip(commonSelectors.globalDataSourceIcon, "Data sources");
    verifyTooltip(
      commonSelectors.workspaceConstantsIcon,
      "Workspace constants"
    );
    verifyTooltip(commonSelectors.notificationsIcon, "Comment notifications");
    verifyTooltip(dashboardSelector.modeToggle, "Mode");
  });

  it("Should verify the app CRUD operation", () => {
    const customLayout = {
      desktop: { top: 100, left: 20 },
      mobile: { width: 8, height: 50 },
    };

    cy.createApp(data.appName);
    cy.apiAddComponentToApp(data.appName, "text1", customLayout);

    cy.backToApps();

    cy.get(commonSelectors.appCard(data.appName)).should(
      "contain.text",
      data.appName
    );

    navigateToAppEditor(data.appName);
    // cy.get(commonSelectors.canvas).should("contain", "text1");
    cy.get(".text-widget-section > div").should("be.visible");
    cy.backToApps();
    cy.wait("@appLibrary");

    cy.deleteApp(data.appName);

    verifyAppDelete(data.appName);
  });

  it("Should verify the folder CRUD operation", () => {
    const customLayout = {
      desktop: { top: 100, left: 20 },
      mobile: { width: 8, height: 50 },
    };

    cy.createApp(data.appName);
    cy.apiAddComponentToApp(data.appName, "text1", customLayout);
    cy.backToApps();

    cy.get(commonSelectors.createNewFolderButton).click();
    verifyModal(
      commonText.createFolder,
      commonText.createFolderButton,
      commonSelectors.folderNameInput
    );
    closeModal(commonText.closeButton);

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.folderName);
    cancelModal(commonText.cancelButton);
    cy.contains(data.folderName).should("not.exist");

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.folderName);
    cy.get(
      commonSelectors.buttonSelector(commonText.createFolderButton)
    ).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(data.folderName)).verifyVisibleElement(
      "have.text",
      dashboardText.folderName(data.folderName)
    );

    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.get(commonSelectors.empytyFolderImage).should("be.visible");
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );

    cy.reloadAppForTheElement(data.folderName);
    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.folderCard).should("be.visible");
    cy.get(
      commonSelectors.editFolderOption(data.folderName)
    ).verifyVisibleElement("have.text", commonText.editFolderOption);
    cy.get(
      commonSelectors.deleteFolderOption(data.folderName)
    ).verifyVisibleElement("have.text", commonText.deleteFolderOption);

    cy.get(commonSelectors.editFolderOption(data.folderName)).click();

    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.modalTitle(commonText.updateFolderTitle))
      .should("be.visible")
      .and("have.text", commonText.updateFolderTitle);
    cy.get(commonSelectors.buttonSelector(commonText.closeButton)).should(
      "be.visible"
    );
    cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(commonSelectors.buttonSelector(commonText.updateFolderButton))
      .should("be.visible")
      .and("have.text", "Edit folder");

    cy.get(commonSelectors.folderNameInput).should("be.visible");

    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);
    closeModal(commonText.closeButton);
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "not.exist"
    );

    cy.reloadAppForTheElement(data.folderName);
    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.editFolderOption(data.folderName)).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);

    cancelModal(commonText.cancelButton);
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "not.exist"
    );

    cy.reloadAppForTheElement(data.folderName);
    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.editFolderOption(data.folderName)).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);
    cy.get(
      commonSelectors.buttonSelector(commonText.updateFolderButton)
    ).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(data.updatedFolderName))
      .should("exist")
      .and("be.visible");

    cy.reloadAppForTheElement(data.folderName);
    viewFolderCardOptions(data.updatedFolderName);
    cy.get(commonSelectors.deleteFolderOption(data.updatedFolderName)).click();
    cy.log(commonText.folderDeleteModalMessage(data.updatedFolderName));
    verifyConfirmationModal(
      `Are you sure you want to delete the folder ${data.updatedFolderName}? Apps within the folder will not be deleted.`
    );

    cancelModal(commonText.cancelButton);
    cy.get(dashboardSelector.folderName(data.updatedFolderName))
      .should("exist")
      .and("be.visible");

    deleteFolder(data.updatedFolderName);
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "not.exist"
    );

    cy.get(commonSelectors.allApplicationsLink).click();
    cy.deleteApp(data.appName);

    verifyAppDelete(data.appName);
    logout();
  });
});
