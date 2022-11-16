import { commonText, path } from "Texts/common";
import { usersSelector } from "Selectors/manageUsers";
import { profileSelector } from "Selectors/profile";
import { commonSelectors } from "Selectors/common";
import moment from "moment";

export const navigateToProfile = () => {
  cy.get(profileSelector.profileDropdown).invoke("show");
  cy.contains("Profile").click();
  cy.url().should("include", path.profilePath);
};

export const logout = () => {
  cy.get(profileSelector.profileDropdown).invoke("show");
  cy.contains("Logout").click();
  cy.url().should("include", path.loginPath);
};

export const navigateToManageUsers = () => {
  cy.get(usersSelector.dropdown).invoke("show");
  cy.contains("Manage Users").click();
  cy.url().should("include", path.manageUsers);
};

export const navigateToManageGroups = () => {
  cy.get(commonSelectors.dropdown).invoke("show");
  cy.contains("Manage Groups").click();
  cy.url().should("include", path.manageGroups);
};

export const navigateToManageSSO = () => {
  cy.get(commonSelectors.dropdown).invoke("show");
  cy.contains("Manage SSO").click();
  cy.url().should("include", path.manageSSO);
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
  cy.get(commonSelectors.deleteFolderOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@folderDeleted");
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.folderDeletedToast
  );
};

export const deleteDownloadsFolder = () => {
  const downloadsFolder = Cypress.config("downloadsFolder");
  cy.task("deleteFolder", downloadsFolder);
};

export const navigateToAppEditor = (appName) => {
  cy.get(commonSelectors.appCard(appName))
    .trigger("mousehover")
    .trigger("mouseenter")
    .find(commonSelectors.editButton)
    .click();
  cy.wait("@appEditor");
};

export const viewAppCardOptions = (appName) => {
  cy.get(commonSelectors.appCard(appName))
    .find(commonSelectors.appCardOptionsButton)
    .click();
};

export const viewFolderCardOptions = (folderName) => {
  cy.get(commonSelectors.folderListcard(folderName))
    .find(commonSelectors.folderCardOptions)
    .click();
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
  cy.clearAndType(commonSelectors.emailFilterInput, email);
  cy.get(commonSelectors.filterButton).click();
}