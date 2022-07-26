import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { fake } from "Fixtures/fake";
import {
  logout,
  createFolder,
  deleteApp,
  deleteFolder,
  deleteDownloadsFolder,
} from "Support/utils/common";
import { commonText } from "Texts/common";

import {
  modifyAndVerifyAppCardIcon,
  login,
  verifyAppDelete,
} from "Support/utils/dashboard";

describe("dashboard", () => {
  const appName = `${fake.companyName}-App`;
  const folderName = `${fake.companyName}-Folder`;
  const cloneAppName = `${fake.companyName}-Clone-App`;
  const updatedFolderName = `New-${folderName}`;

  beforeEach(() => {
    cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
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
      } else {
        cy.log("Installation is finished");
      }
    });

    cy.get(commonSelectors.homePageLogo).should("be.visible");
    cy.get(dashboardSelector.emptyPageImage).should("be.visible");
    cy.get(dashboardSelector.emptyPageHeader)
      .should("be.visible")
      .and("have.text", dashboardText.emptyPageHeader);
    cy.get(dashboardSelector.emptyPageDescription)
      .should("be.visible")
      .and("have.text", dashboardText.emptyPageDescription);
    cy.get(dashboardSelector.createAppButton)
      .should("be.visible")
      .and("have.text", dashboardText.createAppButton);
    cy.get(dashboardSelector.importAppButton)
      .should("be.visible")
      .and("have.text", dashboardText.importAppButton);
    cy.get(dashboardSelector.chooseFromTemplate)
      .should("be.visible")
      .and("have.text", dashboardText.chooseFromTemplate);
    cy.get(dashboardSelector.modeToggle)
      .should("be.visible")
      .and("have.attr", "color", dashboardText.darkMode)
      .click();
    cy.get(dashboardSelector.modeToggle)
      .should("be.visible")
      .and("have.attr", "color", dashboardText.lightMode)
      .click();
    cy.get(dashboardSelector.dropdownText)
      .should("be.visible")
      .and("have.text", dashboardText.dropdownText);
    cy.get(dashboardSelector.dropdown).trigger("mouseover");
    cy.get(dashboardSelector.editButton).should(
      "have.text",
      dashboardText.editButton
    );
    cy.get(dashboardSelector.manageUsers).should(
      "have.text",
      dashboardText.manageUsers
    );
    cy.get(dashboardSelector.manageGroups).should(
      "have.text",
      dashboardText.manageGroups
    );
    cy.get(dashboardSelector.ManageSSO).should(
      "have.text",
      dashboardText.manageSSO
    );

    cy.get(dashboardSelector.userMenu).should("be.visible");
    cy.get(dashboardSelector.userMenu).trigger("mouseover");
    cy.get(dashboardSelector.profileLink).should(
      "have.text",
      dashboardText.profileLink
    );
    cy.get(dashboardSelector.logoutLink).should(
      "have.text",
      dashboardText.logoutLink
    );
    logout();
  });

  it("Should verify app card elements and app card operations", () => {
    cy.appUILogin();
    cy.createApp(appName);

    cy.contains(commonSelectors.appCard, appName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.appCard).should("be.visible");
        cy.get(dashboardSelector.appCardDefaultIcon).should("be.visible");
        cy.get(commonSelectors.appCardOptions).should("be.visible");
        cy.get(commonSelectors.appTitle)
          .should("be.visible")
          .and("have.text", appName);
        cy.get(commonSelectors.appCreatorName)
          .should("be.visible")
          .and("have.text", "The Developer");
        cy.get(commonSelectors.appCreatedTime).should("be.visible");
      });

    cy.get(commonSelectors.appCardOptions).first().click();
    cy.get(commonSelectors.changeIconOption)
      .should("be.visible")
      .and("have.text", commonText.changeIconOption);
    cy.get(commonSelectors.addToFolderOption)
      .should("be.visible")
      .and("have.text", commonText.addToFolderOption);
    cy.get(commonSelectors.cloneAppOption)
      .should("be.visible")
      .and("have.text", commonText.cloneAppOption);
    cy.get(commonSelectors.exportAppOption)
      .should("be.visible")
      .and("have.text", commonText.exportAppOption);
    cy.get(commonSelectors.deleteAppOption)
      .should("be.visible")
      .and("have.text", commonText.deleteAppOption);

    modifyAndVerifyAppCardIcon();

    createFolder(folderName);

    cy.get(commonSelectors.appCardOptions).first().click();
    cy.get(commonSelectors.addToFolderOption).click();
    cy.get(dashboardSelector.addToFolderTitle)
      .should("be.visible")
      .and("have.text", dashboardText.addToFolderTitle);
    cy.get(commonSelectors.modalCloseButton).should("be.visible");
    cy.get(dashboardSelector.moveAppText)
      .should("be.visible")
      .and("have.text", dashboardText.moveAppText(appName));
    cy.get(dashboardSelector.selectFolder).should("be.visible");
    cy.get(commonSelectors.cancelButton)
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(dashboardSelector.addToFolderButton)
      .should("be.visible")
      .and("have.text", dashboardText.addToFolderButton);

    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).contains(folderName).click();
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.AddedToFolderToast
    );
    cy.get(dashboardSelector.folderName(folderName))
      .should("be.visible")
      .and("have.text", dashboardText.folderName(`${folderName} (1)`));

    cy.get(dashboardSelector.folderName(folderName)).click();
    cy.get(commonSelectors.appCard).contains(appName).should("be.visible");
    cy.get(commonSelectors.appCardOptions).click();

    cy.get(commonSelectors.removeFromFolderOption)
      .should("be.visible")
      .and("have.text", commonText.removeFromFolderOption)
      .click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.modalMessage)
      .should("be.visible")
      .and("have.text", commonText.appRemovedFromFolderMessage);
    cy.get(commonSelectors.modalCancelButton)
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(commonSelectors.modalYesButton)
      .should("be.visible")
      .and("have.text", commonText.modalYesButton);

    cy.get(commonSelectors.modalCancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");

    cy.get(commonSelectors.appCardOptions).click();
    cy.get(commonSelectors.removeFromFolderOption).click();
    cy.get(commonSelectors.modalYesButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appRemovedFromFolderTaost
    );
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(commonSelectors.empytyFolderImage).should("be.visible");
    cy.get(commonSelectors.emptyFolderText)
      .should("be.visible")
      .and("have.text", commonText.emptyFolderText);
    cy.get(commonSelectors.allApplicationsLink).click();

    cy.get(commonSelectors.appCardOptions).first().click();
    cy.get(commonSelectors.cloneAppOption).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.appClonedToast
    );
    cy.wait("@appEditor");
    cy.clearAndType(commonSelectors.appNameInput, cloneAppName);
    cy.get(commonSelectors.backButton).click();
    cy.wait("@appLibrary");

    cy.get(commonSelectors.appCard).contains(cloneAppName).should("be.visible");

    cy.get(commonSelectors.appCardOptions).first().click();
    cy.get(commonSelectors.exportAppOption).click();

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      expect(downloadedAppExportFileName).to.have.string(
        cloneAppName.toLowerCase()
      );
    });

    cy.get(commonSelectors.appCardOptions).first().click();
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.modalMessage)
      .should("be.visible")
      .and("have.text", commonText.deleteAppModalMessage);
    cy.get(commonSelectors.modalCancelButton)
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(commonSelectors.modalYesButton)
      .should("be.visible")
      .and("have.text", commonText.modalYesButton);
    cy.get(commonSelectors.modalCancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");

    cy.get(commonSelectors.appCardOptions).first().click();
    cy.get(commonSelectors.deleteAppOption).click();
    cy.get(commonSelectors.modalYesButton).click();

    cy.get(commonSelectors.appCard).contains(cloneAppName).should("not.exist");
    cy.wait(1000);

    deleteFolder(folderName);

    deleteApp(appName);
    verifyAppDelete(appName);

    logout();
  });

  it("Should verify the app CRUD operation", () => {
    cy.appUILogin();
    cy.createApp(appName);
    cy.get(commonSelectors.appCard).should("contain.text", appName);

    cy.contains(commonSelectors.appCard, appName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.appTitle).click();
      });
    cy.get(commonSelectors.editButton).first().click();
    cy.wait("@appEditor");

    cy.dragAndDropWidget("Button");
    cy.get(commonSelectors.canvas).should("contain", "Button");
    cy.get(commonSelectors.backButton).click();
    cy.wait("@appLibrary");

    deleteApp(appName);
    verifyAppDelete(appName);
  });

  it("Should verify the folder CRUD operation", () => {
    cy.appUILogin();
    cy.createApp(appName);

    cy.get(commonSelectors.allApplicationsLink)
      .should("be.visible")
      .and("have.text", commonText.allApplicationsLink);

    cy.get(commonSelectors.folderInfo)
      .should("not.be.visible")
      .and("have.text", commonText.folderInfo);
    cy.get(commonSelectors.createNewFolderButton)
      .should("be.visible")
      .and("have.text", commonText.createNewFolderButton);

    cy.get("body").then(($title) => {
      if ($title.text().includes(commonText.folderInfoText)) {
        cy.get(commonSelectors.folderInfoText)
          .should("not.be.visible")
          .and("have.text", commonText.folderInfoText);
      }
    });

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.createFolderTitle)
      .should("be.visible")
      .and("have.text", commonText.createFolder);
    cy.get(commonSelectors.modalCloseButton).should("be.visible");
    cy.get(commonSelectors.folderNameInput).should("be.visible");
    cy.get(commonSelectors.cancelButton)
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(commonSelectors.createFolderButton)
      .should("be.visible")
      .and("have.text", commonText.createFolderButton);
    cy.get(commonSelectors.modalCloseButton).click();
    cy.get(dashboardText.modalComponent).should("not.exist");

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, folderName);
    cy.get(commonSelectors.cancelButton).click();
    cy.get(dashboardText.modalComponent).should("not.exist");
    cy.contains(folderName).should("not.exist");

    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, folderName);
    cy.get(commonSelectors.createFolderButton).click();
    cy.get(dashboardText.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(folderName))
      .should("be.visible")
      .and("have.text", dashboardText.folderName(folderName));

    cy.get(dashboardSelector.folderName(folderName)).click();
    cy.get(commonSelectors.folderPageTitle)
      .should("be.visible")
      .and("have.text", dashboardText.folderName(folderName));
    cy.get(commonSelectors.empytyFolderImage).should("be.visible");
    cy.get(commonSelectors.emptyFolderText)
      .should("be.visible")
      .and("have.text", commonText.emptyFolderText);

    cy.contains("div", folderName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions).click();
      });
    cy.get(commonSelectors.folderCard).should("be.visible");
    cy.get(commonSelectors.editFolderOption)
      .should("be.visible")
      .and("have.text", commonText.editFolderOption);
    cy.get(commonSelectors.deleteFolderOption)
      .should("be.visible")
      .and("have.text", commonText.deleteFolderOption);

    cy.get(commonSelectors.editFolderOption).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.updateFolderTitle)
      .should("be.visible")
      .and("have.text", commonText.updateFolderTitle);
    cy.get(commonSelectors.modalCloseButton).should("be.visible");
    cy.get(commonSelectors.folderNameInput).should("be.visible");
    cy.get(commonSelectors.cancelButton)
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(commonSelectors.updateFolderButton)
      .should("be.visible")
      .and("have.text", commonText.updateFolderButton);

    cy.clearAndType(commonSelectors.folderNameInput, updatedFolderName);
    cy.get(commonSelectors.modalCloseButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(updatedFolderName)).should("not.exist");

    cy.contains("div", folderName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions).click();
      });
    cy.get(commonSelectors.editFolderOption).click();
    cy.clearAndType(commonSelectors.folderNameInput, updatedFolderName);
    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(updatedFolderName)).should("not.exist");

    cy.contains("div", folderName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions).click();
      });
    cy.get(commonSelectors.editFolderOption).click();
    cy.clearAndType(commonSelectors.folderNameInput, updatedFolderName);
    cy.get(commonSelectors.updateFolderButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(updatedFolderName))
      .should("exist")
      .and("be.visible");

    cy.contains("div", folderName)
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions).click();
      });
    cy.get(commonSelectors.deleteFolderOption).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.modalMessage)
      .should("be.visible")
      .and("have.text", `${commonText.folderDeleteModalMessage}`);
    cy.get(commonSelectors.modalCancelButton)
      .should("be.visible")
      .and("have.text", commonText.cancelButton);
    cy.get(commonSelectors.modalYesButton)
      .should("be.visible")
      .and("have.text", commonText.modalYesButton);

    cy.get(commonSelectors.modalCancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(updatedFolderName))
      .should("exist")
      .and("be.visible");

    deleteFolder(updatedFolderName);
    cy.get(dashboardSelector.folderName(updatedFolderName)).should("not.exist");

    cy.get(commonSelectors.allApplicationsLink).click();
    deleteApp(appName);
    verifyAppDelete(appName);
  });
});
