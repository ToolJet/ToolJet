import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { fake } from "Fixtures/fake";
import {
  createFolder,
  deleteFolder,
  deleteDownloadsFolder,
  navigateToAppEditor,
  viewAppCardOptions,
  verifyModal,
  verifyConfirmationModal,
  viewFolderCardOptions,
  closeModal,
  cancelModal,
} from "Support/utils/common";
import { commonText, assertions } from "Texts/common";
import {
  modifyAndVerifyAppCardIcon,
  login,
  verifyAppDelete,
} from "Support/utils/dashboard";

describe("dashboard", () => {
  const data = {};
  data.appName = `${fake.companyName}-App`;
  data.folderName = `${fake.companyName}-Folder`;
  data.cloneAppName = `${data.appName}-Clone`;
  data.updatedFolderName = `New-${data.folderName}`;

  beforeEach(() => {
    cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
    cy.intercept("GET", "/api/apps").as("appEditor");
    cy.intercept("GET", "/api/library_apps/").as("appLibrary");
  });

  before(() => {
    cy.intercept("GET", "/api/apps?page=1&folder=&searchKey=", {
      fixture: "intercept/emptyDashboard.json",
    }).as("emptyDashboard");
    login();
    cy.wait("@emptyDashboard");

    deleteDownloadsFolder();
  });

  it("should verify the elements on empty dashboard", () => {
    cy.get("body").then(($el) => {
      if ($el.text().includes("Skip")) {
        cy.get(commonSelectors.skipInstallationModal).click();
      }
    });

    cy.get(commonSelectors.homePageLogo).should("be.visible");
    cy.get(dashboardSelector.emptyPageImage).should("be.visible");
    cy.get(dashboardSelector.emptyPageHeader).verifyElement(
      assertions.text,
      dashboardText.emptyPageHeader
    );
    cy.get(dashboardSelector.emptyPageDescription).verifyElement(
      assertions.text,
      dashboardText.emptyPageDescription
    );
    cy.get(dashboardSelector.createAppButton).verifyElement(
      assertions.text,
      dashboardText.createAppButton
    );
    cy.get(dashboardSelector.importAppButton).verifyElement(
      assertions.text,
      dashboardText.importAppButton
    );
    cy.get(dashboardSelector.chooseFromTemplate).verifyElement(
      assertions.text,
      dashboardText.chooseFromTemplate
    );
    cy.get(dashboardSelector.modeToggle)
      .should("be.visible")
      .verifyElement(assertions.attribute, "color", dashboardText.darkMode)
      .click();
    cy.get(dashboardSelector.modeToggle)
      .should("be.visible")
      .verifyElement(assertions.attribute, "color", dashboardText.lightMode)
      .click();
    cy.get(dashboardSelector.dropdownText).verifyElement(
      assertions.text,
      dashboardText.dropdownText
    );
    cy.get(dashboardSelector.dropdown).trigger("mouseover");
    cy.get(dashboardSelector.editButton).should(
      assertions.text,
      dashboardText.editButton
    );
    cy.get(dashboardSelector.manageUsers).should(
      assertions.text,
      dashboardText.manageUsers
    );
    cy.get(dashboardSelector.manageGroups).should(
      assertions.text,
      dashboardText.manageGroups
    );
    cy.get(dashboardSelector.ManageSSO).should(
      assertions.text,
      dashboardText.manageSSO
    );

    cy.get(dashboardSelector.userMenu).should("be.visible");
    cy.get(dashboardSelector.userMenu).trigger("mouseover");
    cy.get(dashboardSelector.profileLink).should(
      assertions.text,
      dashboardText.profileLink
    );
    cy.get(dashboardSelector.logoutLink).should(
      assertions.text,
      dashboardText.logoutLink
    );
  });

  it("Should verify app card elements and app card operations", () => {
    cy.appUILogin();
    cy.createApp(data.appName);

    cy.get(commonSelectors.appCard(data.appName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.appCard(data.appName)).should("be.visible");
        cy.get(dashboardSelector.appCardDefaultIcon).should("be.visible");
        cy.get(commonSelectors.appCardOptionsButton).should("be.visible");
        cy.get(commonSelectors.appTitle(data.appName)).verifyElement(
          assertions.text,
          data.appName
        );
        cy.get(commonSelectors.appCreatorName).verifyElement(
          assertions.text,
          "The Developer"
        );
        cy.get(commonSelectors.appCreatedTime).should("be.visible");
      });

    viewAppCardOptions(data.appName);
    cy.get(
      commonSelectors.appCardOptions(commonText.changeIconOption)
    ).verifyElement(assertions.text, commonText.changeIconOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.addToFolderOption)
    ).verifyElement(assertions.text, commonText.addToFolderOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.cloneAppOption)
    ).verifyElement(assertions.text, commonText.cloneAppOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.exportAppOption)
    ).verifyElement(assertions.text, commonText.exportAppOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.deleteAppOption)
    ).verifyElement(assertions.text, commonText.deleteAppOption);

    modifyAndVerifyAppCardIcon(data.appName);

    createFolder(data.folderName);

    viewAppCardOptions(data.appName);
    cy.get(
      commonSelectors.appCardOptions(commonText.addToFolderOption)
    ).click();
    verifyModal(
      dashboardText.addToFolderTitle,
      dashboardText.addToFolderButton,
      dashboardSelector.selectFolder
    );
    cy.get(dashboardSelector.moveAppText).verifyElement(
      assertions.text,
      dashboardText.moveAppText(data.appName)
    );

    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).contains(data.folderName).click();
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.AddedToFolderToast
    );

    cy.get(dashboardSelector.folderName(data.folderName)).verifyElement(
      assertions.text,
      dashboardText.folderName(`${data.folderName} (1)`)
    );

    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.get(commonSelectors.appCard(data.appName))
      .contains(data.appName)
      .should("be.visible");
    viewAppCardOptions(data.appName);

    cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption))
      .verifyElement(assertions.text, commonText.removeFromFolderOption)
      .click();
    verifyConfirmationModal(commonText.appRemovedFromFolderMessage);

    cancelModal(commonText.cancelButton);

    cy.get(commonSelectors.appCardOptionsButton).click();
    cy.get(
      commonSelectors.appCardOptions(commonText.removeFromFolderOption)
    ).click();
    cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appRemovedFromFolderTaost
    );
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(commonSelectors.empytyFolderImage).should("be.visible");
    cy.get(commonSelectors.emptyFolderText).verifyElement(
      assertions.text,
      commonText.emptyFolderText
    );
    cy.get(commonSelectors.allApplicationsLink).click();

    viewAppCardOptions(data.appName);
    cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.appClonedToast
    );
    cy.wait("@appEditor");
    cy.clearAndType(commonSelectors.appNameInput, data.cloneAppName);
    cy.get(commonSelectors.backButton).click();
    cy.wait("@appLibrary");

    cy.get(commonSelectors.appCard(data.cloneAppName)).should("be.visible");

    viewAppCardOptions(data.cloneAppName);
    cy.get(commonSelectors.appCardOptions(commonText.exportAppOption)).click();

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      expect(downloadedAppExportFileName).to.have.string(
        data.cloneAppName.toLowerCase()
      );
    });

    viewAppCardOptions(data.cloneAppName);
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.modalMessage).verifyElement(
      assertions.text,
      commonText.deleteAppModalMessage
    );
    cy.get(
      commonSelectors.buttonSelector(commonText.cancelButton)
    ).verifyElement(assertions.text, commonText.cancelButton);
    cy.get(
      commonSelectors.buttonSelector(commonText.modalYesButton)
    ).verifyElement(assertions.text, commonText.modalYesButton);
    cancelModal(commonText.cancelButton);

    viewAppCardOptions(data.cloneAppName);
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.cloneAppName);

    deleteFolder(data.folderName);

    cy.deleteApp(data.appName);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.appName);
  });

  it("Should verify the app CRUD operation", () => {
    cy.appUILogin();
    cy.createApp(data.appName);
    cy.get(commonSelectors.appCard(data.appName)).should(
      "contain.text",
      data.appName
    );

    navigateToAppEditor(data.appName);
    cy.dragAndDropWidget("Button");
    cy.get(commonSelectors.canvas).should("contain", "Button");
    cy.get(commonSelectors.backButton).click();
    cy.wait("@appLibrary");

    cy.deleteApp(data.appName);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.appName);
  });

  it("Should verify the folder CRUD operation", () => {
    cy.appUILogin();
    cy.createApp(data.appName);

    cy.get(commonSelectors.allApplicationsLink).verifyElement(
      assertions.text,
      commonText.allApplicationsLink
    );

    cy.get(commonSelectors.folderInfo)
      .should("not.be.visible")
      .and(assertions.text, commonText.folderInfo);
    cy.get(commonSelectors.createNewFolderButton).verifyElement(
      assertions.text,
      commonText.createNewFolderButton
    );

    cy.get("body").then(($title) => {
      if ($title.text().includes(commonText.folderInfoText)) {
        cy.get(commonSelectors.folderInfoText)
          .should("not.be.visible")
          .and(assertions.text, commonText.folderInfoText);
      }
    });

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
    cy.get(dashboardSelector.folderName(data.folderName)).verifyElement(
      assertions.text,
      dashboardText.folderName(data.folderName)
    );

    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.get(commonSelectors.folderPageTitle).verifyElement(
      assertions.text,
      dashboardText.folderName(data.folderName)
    );
    cy.get(commonSelectors.empytyFolderImage).should("be.visible");
    cy.get(commonSelectors.emptyFolderText).verifyElement(
      assertions.text,
      commonText.emptyFolderText
    );

    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.folderCard).should("be.visible");
    cy.get(commonSelectors.editFolderOption).verifyElement(
      assertions.text,
      commonText.editFolderOption
    );
    cy.get(commonSelectors.deleteFolderOption).verifyElement(
      assertions.text,
      commonText.deleteFolderOption
    );

    cy.get(commonSelectors.editFolderOption).click();
    verifyModal(
      commonText.updateFolderTitle,
      commonText.updateFolderButton,
      commonSelectors.folderNameInput
    );

    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);
    closeModal(commonText.closeButton);
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "not.exist"
    );

    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.editFolderOption).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);

    cancelModal(commonText.cancelButton);
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "not.exist"
    );

    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.editFolderOption).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);
    cy.get(
      commonSelectors.buttonSelector(commonText.updateFolderButton)
    ).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(data.updatedFolderName))
      .should("exist")
      .and("be.visible");

    viewFolderCardOptions(data.updatedFolderName);
    cy.get(commonSelectors.deleteFolderOption).click();
    verifyConfirmationModal(commonText.folderDeleteModalMessage);

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
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.appName);
  });
});
