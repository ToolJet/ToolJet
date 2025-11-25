import { commonSelectors } from "Selectors/common";
import {
  commonEeSelectors,
  instanceSettingsSelector,
} from "Selectors/eeCommon";
import { usersSelector } from "Selectors/manageUsers";
import {
  instanceAllUsersSelectors,
  usersTableElementsInInstance,
} from "Selectors/superAdminSelectors";
import {
  openInstanceSettings,
  openUserActionMenu,
} from "Support/utils/platform/eeCommon";
import { instanceSettingsText } from "Texts/eeCommon";
import {
  instanceAllUsersText,
  usersTableElementsInInstanceText,
} from "Texts/superAdminText";

import { onboardingSelectors } from "Selectors/onboarding";

import { usersText } from "Texts/manageUsers";

export const openAllUsersPage = () => {
  openInstanceSettings();
};

export const verifyAllUsersHeaderUI = () => {
  cy.get(commonEeSelectors.pageTitle).verifyVisibleElement(
    "have.text",
    instanceSettingsText.pageTitle
  );
  cy.get(instanceSettingsSelector.allUsersTab).verifyVisibleElement(
    "have.text",
    instanceAllUsersText.allUsersTabInInstance
  );
  cy.get(instanceSettingsSelector.manageInstanceSettings).verifyVisibleElement(
    "have.text",
    instanceSettingsText.manageInstanceSettings
  );
  cy.get('[data-cy="breadcrumb-header-settings"]').verifyVisibleElement(
    "have.text",
    "SettingsAll Users"
  );
  cy.get('[data-cy="title-users-page"]').should(
    "have.text",
    "Manage all users"
  );
};

export const verifyTableControls = () => {
  for (const element in usersTableElementsInInstance) {
    cy.get(usersTableElementsInInstance[element]).verifyVisibleElement(
      "have.text",
      usersTableElementsInInstanceText[element]
    );
  }
  cy.get(usersSelector.userFilterInput).should("be.visible");
  cy.get(instanceSettingsSelector.typeColumnHeader).verifyVisibleElement(
    "have.text",
    instanceSettingsText.typeColumnHeader
  );
  cy.get(instanceSettingsSelector.workspaceColumnHeader).verifyVisibleElement(
    "have.text",
    instanceSettingsText.workspaceColumnHeader
  );
};

export const verifyUsersFilterOptions = () => {
  cy.get(usersSelector.userFilterInput).click();
  ["All", "Active", "Invited", "Archived"].forEach((opt) => {
    cy.contains(opt).should("be.visible");
  });
  cy.get("body").click(0, 0);
};

export const verifyUserRow = (
  userName,
  userEmail,
  userType = "workspace",
  userStatus = "active"
) => {
  cy.get(instanceSettingsSelector.userName(userName)).verifyVisibleElement(
    "have.text",
    userName
  );
  cy.get(instanceSettingsSelector.userEmail(userName)).verifyVisibleElement(
    "have.text",
    userEmail
  );
  cy.get(instanceSettingsSelector.userType(userName)).verifyVisibleElement(
    "have.text",
    userType
  );
  cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement(
    "have.text",
    userStatus
  );
};

export const openResetPasswordModal = () => {
  cy.get(instanceAllUsersSelectors.resetPasswordButton).click();
};

export const verifyResetPasswordModalUI = (userEmail) => {
  openResetPasswordModal();
  cy.get('[data-cy="reset-password-title"]').should(
    "have.text",
    "Reset password"
  );
  cy.contains(userEmail).should("be.visible");
  cy.contains("label", "Automatically generate a password").should(
    "be.visible"
  );
  cy.contains(
    "You will be able to view and copy the password in the next step"
  ).should("be.visible");
  cy.contains("label", "Create password").should("be.visible");
  cy.contains("label", "Create password").click();
  cy.get('[data-cy="password-input"]').should("be.visible");
  cy.contains("Password should be at least 5 characters").should("be.visible");
  cy.get(commonSelectors.cancelButton).should("be.visible");
  cy.get('[data-cy="reset-button"]').should("be.visible");
  cy.get(commonSelectors.cancelButton).click();
};

export const verifyUserActionMenu = (userName) => {
  openUserActionMenu(userName);
  cy.get(instanceAllUsersSelectors.editUserDetailsButton).verifyVisibleElement(
    "have.text",
    instanceAllUsersText.editUserDetails
  );
  cy.get(instanceAllUsersSelectors.resetPasswordButton).should("be.visible");
  cy.get(instanceAllUsersSelectors.archiveUserButton).verifyVisibleElement(
    "have.text",
    instanceAllUsersText.archiveUser
  );
};

export const openArchiveUserModal = (userName) => {
  openUserActionMenu(userName);
  cy.get(instanceAllUsersSelectors.archiveUserButton).click();
};

export const verifyArchiveUserModalUI = (userName, userEmail) => {
    openArchiveUserModal(userName);
    cy.get(commonEeSelectors.modalTitle).contains(
        instanceAllUsersText.archiveModalTitle
    );
    cy.contains(userEmail).should("be.visible");
    cy.contains(instanceAllUsersText.archiveModalMessage).should("be.visible");
    cy.get(commonSelectors.cancelButton).should("be.visible");
    cy.contains("button", instanceAllUsersText.archiveConfirmButton).should(
        "be.visible"
    );
    cy.get(commonSelectors.cancelButton).click();

    openArchiveUserModal(userEmail);
    cy.get('[data-cy="confirm-button"]').click();
    cy.wait(1000);
     cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "User has been archived from this instance successfully!"
    );
    cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement(
        "have.text",
        "archived"
    );
};

export const openEditUserModal = (userEmail) => {
  openUserActionMenu(userEmail);
  cy.get(instanceAllUsersSelectors.editUserDetailsButton).click();
};

export const updateUserNameAndVerifyChanges = ({
  currentName,
  userEmail,
  newName,
}) => {
  openEditUserModal(userEmail);
  cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
    "have.text",
    instanceSettingsText.editModalTitle
  );
  cy.verifyLabel("Name");
  cy.get(instanceAllUsersSelectors.inputFieldFullName)
    .should("be.visible")
    .should("have.value", currentName)
    .clear()
    .type(newName);
  cy.get(instanceAllUsersSelectors.inputFieldEmail)
    .should("be.visible")
    .should("have.value", userEmail);
  cy.verifyLabel("Email address");
  cy.get(instanceSettingsSelector.superAdminToggle).should("be.visible");
  cy.get(instanceAllUsersSelectors.updateButton).click();
  cy.contains(newName).should("be.visible");
};

export const verifyUnarchiveUserModal = (userName, userEmail) => {
  openArchiveUserModal(userEmail);

  cy.contains(userEmail).should("be.visible");
  cy.contains(instanceAllUsersText.unarchiveModalMessage).should("be.visible");
  cy.contains("button", instanceAllUsersText.unarchiveConfirmButton).should(
    "be.visible"
  );
  cy.get(commonSelectors.cancelButton).should("be.visible").click();

    openArchiveUserModal(userEmail);
    cy.get('[data-cy="confirm-button"]').click();
    cy.wait(1000);
     cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "User has been unarchived from this instance successfully!"
    );
    cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement(
        "have.text",
        "active"
    );
  openArchiveUserModal(userEmail);
  cy.get('[data-cy="confirm-button"]').click();

  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "User has been unarchived from this instance successfully!"
  );

  cy.wait(1000);
  cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement(
    "have.text",
    "active"
  );
};

export const loginAsUser = (email, password = usersText.password) => {
  cy.visit("/my-workspace");
  cy.waitForElement(onboardingSelectors.signupEmailInput);
  cy.wait(500);
  cy.clearAndType(onboardingSelectors.signupEmailInput, email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
  cy.get(onboardingSelectors.signInButton).click();
};

export const loginAndExpectToast = (email, message, password = usersText.password) => {
  loginAsUser(email, password);
  cy.verifyToastMessage(commonSelectors.toastMessage, message);
};

export const visitAllUsersPage = (loginEmail) => {
  if (loginEmail) {
    cy.apiLogin(loginEmail);
  } else {
    cy.apiLogin();
  }
  cy.visit("settings/all-users");
  cy.waitForElement(commonSelectors.homePageLogo);
  cy.wait(1000);
};