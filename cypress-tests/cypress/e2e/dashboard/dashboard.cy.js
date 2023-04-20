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
import {
  modifyAndVerifyAppCardIcon,
  login,
  verifyAppDelete,
} from "Support/utils/dashboard";
import { profileSelector } from "Selectors/profile";
import { profileText } from "Texts/profile";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";

describe("dashboard", () => {
  const data = {};
  data.appName = `${fake.companyName}-App`;
  data.folderName = `${fake.companyName}-Folder`;
  data.cloneAppName = `cloned-${data.appName}`;
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
    cy.intercept("GET", "/api/folders?searchKey=",{"folders":[]}).as("folders");
    login();
    cy.wait("@emptyDashboard");
    cy.wait("@folders");


    deleteDownloadsFolder();
  });

  it("should verify the elements on empty dashboard", () => {
    cy.get(commonSelectors.homePageLogo).should("be.visible");
    cy.get(
      commonSelectors.workspaceName
    ).verifyVisibleElement("have.text", "My workspace");
    cy.get(commonSelectors.workspaceName).click();
    cy.get(commonSelectors.workspaceEditButton).should("be.visible");
    cy.get(commonSelectors.appCreateButton).verifyVisibleElement(
      "have.text",
      "New app"
    );
    cy.get(dashboardSelector.folderLabel).should("be.visible");
    cy.get(dashboardSelector.folderLabel).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Folders");
    });
    cy.get(commonSelectors.createNewFolderButton).verifyVisibleElement(
      "have.text",
      "+ Create new"
    );
    cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
      "have.text",
      commonText.allApplicationLink
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

    cy.get(commonSelectors.profileSettings).should("be.visible").click();
    cy.get(profileSelector.profileLink).verifyVisibleElement(
      "have.text",
      profileText.profileLink
    );
    cy.get(dashboardSelector.modeToggle)
      .verifyVisibleElement("have.text", dashboardText.darkModeText)
      .click();
    cy.get(commonSelectors.mainWrapper)
      .should("have.attr", "class")
      .and("contain", "theme-dark");
    cy.get(dashboardSelector.modeToggle)
      .verifyVisibleElement("have.text", dashboardText.lightModeText)
      .click();
    cy.get(dashboardSelector.homePageContent)
      .should("have.attr", "class")
      .and("contain", "bg-light-gray");
    cy.get(commonSelectors.logoutLink).verifyVisibleElement(
      "have.text",
      commonText.logoutLink
    );

    cy.get(dashboardSelector.dashboardAppsHeaderLabel).verifyVisibleElement(
      "have.text",
      dashboardText.dashboardAppsHeaderLabel
    );
    cy.get(dashboardSelector.versionLabel).should("be.visible");
    cy.get(dashboardSelector.emptyPageImage).should("be.visible");
    cy.get(dashboardSelector.emptyPageHeader).verifyVisibleElement(
      "have.text",
      dashboardText.emptyPageHeader
    );
    cy.get(dashboardSelector.emptyPageDescription).verifyVisibleElement(
      "have.text",
      dashboardText.emptyPageDescription
    );
    cy.get(dashboardSelector.createAppButton).verifyVisibleElement(
      "have.text",
      dashboardText.createAppButton
    );
    cy.get(dashboardSelector.importAppButton)
      .invoke("text")
      .then((text) => {
        expect(text.replace(/\u00a0/g, " ")).equal(
          dashboardText.importAppButton
        );
      });
    cy.get(dashboardSelector.appTemplateRow).should("be.visible");
  });

  it("Should verify app card elements and app card operations", () => {
    cy.appUILogin();
    cy.createApp();
    cy.renameApp(data.appName);
    cy.get(commonSelectors.editorPageLogo).click();

    cy.wait(500);
    cy.reloadAppForTheElement(data.appName);
    cy.get(commonSelectors.appCard(data.appName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.appCard(data.appName)).should("be.visible");
        cy.get(commonSelectors.appTitle(data.appName)).verifyVisibleElement(
          "have.text",
          data.appName
        );
        cy.get(commonSelectors.appCreationDetails).should("be.visible");
        cy.get(commonSelectors.appCreationDetails)
          .should("be.visible")
          .and(($el) => {
            expect($el.contents().last().text().trim()).to.eq("The Developer");
          });
      });

    viewAppCardOptions(data.appName);
    cy.get(
      commonSelectors.appCardOptions(commonText.changeIconOption)
    ).verifyVisibleElement("have.text", commonText.changeIconOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.addToFolderOption)
    ).verifyVisibleElement("have.text", commonText.addToFolderOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.cloneAppOption)
    ).verifyVisibleElement("have.text", commonText.cloneAppOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.exportAppOption)
    ).verifyVisibleElement("have.text", commonText.exportAppOption);
    cy.get(
      commonSelectors.appCardOptions(commonText.deleteAppOption)
    ).verifyVisibleElement("have.text", commonText.deleteAppOption);

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
    cy.get(dashboardSelector.moveAppText).verifyVisibleElement(
      "have.text",
      dashboardText.moveAppText(data.appName)
    );

    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).contains(data.folderName).click();
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.AddedToFolderToast
    );

    cy.get(dashboardSelector.folderName(data.folderName)).verifyVisibleElement(
      "have.text",
      dashboardText.folderName(`${data.folderName} (1)`)
    );

    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.get(commonSelectors.appCard(data.appName))
      .contains(data.appName)
      .should("be.visible");
    viewAppCardOptions(data.appName);

    cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption))
      .verifyVisibleElement("have.text", commonText.removeFromFolderOption)
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
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );
    cy.get(commonSelectors.allApplicationsLink).click();
    deleteFolder(data.folderName);

    cy.get(commonSelectors.allApplicationsLink).click();
    viewAppCardOptions(data.appName);
    cy.get(commonSelectors.appCardOptions(commonText.cloneAppOption)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.appClonedToast
    );
    cy.wait("@appEditor");
    cy.clearAndType(commonSelectors.appNameInput, data.cloneAppName);
    cy.get(commonSelectors.editorPageLogo).click();
    cy.wait("@appLibrary");
    cy.wait(500);
    cy.reloadAppForTheElement(data.appName);

    cy.get(commonSelectors.appCard(data.cloneAppName)).should("be.visible");

    viewAppCardOptions(data.cloneAppName);
    cy.get(commonSelectors.appCardOptions(commonText.exportAppOption)).click();
    cy.get(commonSelectors.exportAllButton).click();

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      expect(downloadedAppExportFileName).to.have.string(
        data.cloneAppName.toLowerCase()
      );
    });

    viewAppCardOptions(data.cloneAppName);
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.modalMessage).verifyVisibleElement(
      "have.text",
      commonText.deleteAppModalMessage
    );
    cy.get(
      commonSelectors.buttonSelector(commonText.cancelButton)
    ).verifyVisibleElement("have.text", commonText.cancelButton);
    cy.get(
      commonSelectors.buttonSelector(commonText.modalYesButton)
    ).verifyVisibleElement("have.text", commonText.modalYesButton);
    cancelModal(commonText.cancelButton);

    viewAppCardOptions(data.cloneAppName);
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.cloneAppName);
    cy.wait("@appLibrary");

    cy.deleteApp(data.appName);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.appName);
  });

  it("Should verify the app CRUD operation", () => {
    data.appName = `${fake.companyName}-App`;
    cy.appUILogin();
    cy.createApp();
    cy.renameApp(data.appName);
    cy.get(commonSelectors.editorPageLogo).click();
    cy.get(commonSelectors.appCard(data.appName)).should(
      "contain.text",
      data.appName
    );

    navigateToAppEditor(data.appName);
    cy.dragAndDropWidget("Button");
    cy.get(commonSelectors.canvas).should("contain", "Button");
    cy.get(commonSelectors.editorPageLogo).click();
    cy.wait("@appLibrary");

    cy.deleteApp(data.appName);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
    verifyAppDelete(data.appName);
  });

  it("Should verify the folder CRUD operation", () => {
    data.appName = `${fake.companyName}-App`;
    cy.appUILogin();
    cy.createApp();
    cy.renameApp(data.appName);
    cy.get(commonSelectors.editorPageLogo).click();

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

    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.folderCard).should("be.visible");
    cy.get(commonSelectors.editFolderOption).verifyVisibleElement(
      "have.text",
      commonText.editFolderOption
    );
    cy.get(commonSelectors.deleteFolderOption).verifyVisibleElement(
      "have.text",
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
