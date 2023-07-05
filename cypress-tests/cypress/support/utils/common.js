import { commonText, path } from "Texts/common";
import { usersSelector } from "Selectors/manageUsers";
import { profileSelector } from "Selectors/profile";
import { commonSelectors } from "Selectors/common";
import moment from "moment";
import { dashboardSelector } from "Selectors/dashboard";

export const navigateToProfile = () => {
  cy.get(commonSelectors.profileSettings).click();
  cy.get(profileSelector.profileLink).click();
  cy.url().should("include", "settings");
};

export const logout = () => {
  cy.get(commonSelectors.profileSettings).click();
  cy.get(commonSelectors.logoutLink).click();
};

export const navigateToManageUsers = () => {
  cy.get(commonSelectors.workspaceSettingsIcon).click();
  cy.get(commonSelectors.manageUsersOption).click();
};

export const navigateToManageGroups = () => {
  cy.get(commonSelectors.workspaceSettingsIcon).click();
  cy.get(commonSelectors.manageGroupsOption).click();
};
export const navigateToWorkspaceVariable = () => {
  cy.get(commonSelectors.workspaceSettingsIcon).click();
  cy.get(commonSelectors.workspaceVariableOption).click();
};

export const navigateToManageSSO = () => {
  cy.get(commonSelectors.workspaceSettingsIcon).click();
  cy.get(commonSelectors.manageSSOOption).click();
};

export const randomDateOrTime = (format = "DD/MM/YYYY") => {
  let endDate = new Date();
  let startDate = new Date(2018, 0, 1);
  startDate = new Date(
    startDate.getTime() +
      Math.random() * (endDate.getTime() - startDate.getTime())
  );
  return moment(startDate).format(format);
};

export const createFolder = (folderName) => {
  cy.intercept("POST", "/api/folders").as("folderCreated");
  cy.get(commonSelectors.createNewFolderButton).click();
  cy.clearAndType(commonSelectors.folderNameInput, folderName);
  cy.get(commonSelectors.buttonSelector(commonText.createFolderButton)).click();
  cy.wait("@folderCreated");
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.folderCreatedToast
  );
};

export const deleteFolder = (folderName) => {
  viewFolderCardOptions(folderName);
  cy.get(commonSelectors.deleteFolderOption(folderName)).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@folderDeleted");
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.folderDeletedToast
  );
};

export const deleteDownloadsFolder = () => {
  cy.exec("cd ./cypress/downloads/ && rm -rf *", {
    failOnNonZeroExit: false,
  });
};

export const navigateToAppEditor = (appName) => {
  cy.get(commonSelectors.appCard(appName))
    .trigger("mousehover")
    .trigger("mouseenter")
    .find(commonSelectors.editButton)
    .click({ force: true });
  //cy.wait("@appEditor");
};

export const viewAppCardOptions = (appName) => {
  cy.contains("div", appName)
    .parent()
    .within(() => {
      cy.get(commonSelectors.appCardOptionsButton).invoke("click");
    });
};

export const viewFolderCardOptions = (folderName) => {
  cy.get(commonSelectors.folderListcard(folderName))
    .parent()
    .within(() => {
      cy.get(commonSelectors.folderCardOptions(folderName)).invoke("click");
    });
};

export const verifyModal = (title, buttonText, inputFiledSelector) => {
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalTitle(title))
    .should("be.visible")
    .and("have.text", title);
  cy.get(commonSelectors.buttonSelector(commonText.closeButton)).should(
    "be.visible"
  );
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(buttonText))
    .should("be.visible")
    .and("have.text", buttonText);

  if (inputFiledSelector) {
    cy.get(inputFiledSelector).should("be.visible");
  }
};

export const verifyConfirmationModal = (messagse) => {
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalMessage)
    .should("be.visible")
    .and("have.text", messagse);
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton))
    .should("be.visible")
    .and("have.text", commonText.modalYesButton);
};

export const closeModal = (buttonText) => {
  cy.get(commonSelectors.buttonSelector(buttonText)).click();
  cy.get(commonSelectors.modalComponent).should("not.exist");
};

export const cancelModal = (buttonText) => {
  cy.get(commonSelectors.buttonSelector(buttonText)).click();
  cy.get(commonSelectors.modalComponent).should("not.exist");
};

export const manageUsersPagination = (email) => {
  cy.wait(200);
  cy.get("body").then(($email) => {
    if ($email.text().includes(email)) {
      cy.log("First page");
    } else {
      cy.get(commonSelectors.nextPageArrow).click();
      manageUsersPagination(email);
    }
  });
};

export const searchUser = (email) => {
  cy.clearAndType(commonSelectors.inputUserSearch, email);
};

export const createWorkspace = (workspaceName) => {
  cy.get(commonSelectors.workspaceName).click();
  cy.get(commonSelectors.addWorkspaceButton).click();
  cy.clearAndType(commonSelectors.workspaceNameInput, workspaceName);
  cy.intercept("GET", "/api/apps?page=1&folder=&searchKey=").as("homePage");
  cy.get(commonSelectors.createWorkspaceButton).click();
  cy.wait("@homePage");
};

export const selectAppCardOption = (appName, appCardOption) => {
  viewAppCardOptions(appName);
  cy.get(appCardOption).should("be.visible").realClick();
};

export const navigateToDatabase = () => {
  cy.get(commonSelectors.databaseIcon).click();
  cy.url().should("include", path.database);
};
export const randomValue = () => {
  return Math.floor(Math.random() * (1000 - 100) + 100) / 100;
};

export const verifyTooltip = (selector, message) => {
  cy.get(selector)
    .trigger("mouseover", { timeout: 2000 })
    .trigger("mouseover")
    .then(() => {
      cy.get(".tooltip-inner").last().should("have.text", message);
    });
};
