// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// allUsers.js
//   openAllUsersPage                 instanceUser.list    → superAdmin
//   verifyAllUsersHeaderUI           instanceUser.verifyHeader → superAdmin
//   verifyTableControls              instanceUser.verifyControls → superAdmin
//   verifyUsersFilterOptions         instanceUser.verifyFilters → superAdmin
//   verifyUserRow                    instanceUser.verifyRow → superAdmin
//   openResetPasswordModal           instanceUser.openResetPassword → superAdmin
//   verifyResetPasswordModalUI       instanceUser.verifyResetPasswordModal → superAdmin
//   verifyUserActionMenu             instanceUser.verifyRowMenu → superAdmin
//   openArchiveUserModal             instanceUser.openArchiveModal → superAdmin
//   verifyArchiveUserModalUI         instanceUser.verifyArchiveModal → superAdmin
//   openEditUserModal                instanceUser.openEditModal → superAdmin
//   updateUserNameAndVerifyChanges   instanceUser.updateName → superAdmin
//   verifyUnarchiveUserModal         instanceUser.unarchive → superAdmin
//   loginAsUser                      session.loginAs      → onboarding
//   loginAndExpectToast              session.loginExpectToast → onboarding
//   visitAllUsersPage                instanceUser.visitAs → superAdmin
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors } from "Selectors/common";
import {
  commonEeSelectors,
  instanceSettingsSelector,
} from "Selectors/platform/eeCommon";
import { usersSelector } from "Selectors/platform/manageUsers";
import {
  instanceAllUsersSelectors,
  usersTableElementsInInstance,
} from "Selectors/platform/superAdminSelectors";
import {
  openInstanceSettings,
  openUserActionMenu,
} from "Support/utils/platform/eeCommon";
import { instanceSettingsText } from "Texts/platform/eeCommon";
import {
  instanceAllUsersText,
  usersTableElementsInInstanceText,
} from "Texts/platform/superAdminText";

import { onboardingSelectors } from "Selectors/platform/onboarding";

import { usersText } from "Texts/platform/manageUsers";

/**
* @tjType   instanceUser.list
* @tjBlock  superAdmin
* @tjUsage  openAllUsersPage()
* @tjDom    instance settings -> All users
*/
export const openAllUsersPage = () => {
  openInstanceSettings();
};

/**
* @tjType   instanceUser.verifyHeader
* @tjBlock  superAdmin
* @tjUsage  verifyAllUsersHeaderUI()
* @tjDom    page title + breadcrumb
*/
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

/**
* @tjType   instanceUser.verifyControls
* @tjBlock  superAdmin
* @tjUsage  verifyTableControls()
* @tjDom    search, filter, column headers
*/
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

/**
* @tjType   instanceUser.verifyFilters
* @tjBlock  superAdmin
* @tjUsage  verifyUsersFilterOptions()
* @tjDom    status filter dropdown options
*/
export const verifyUsersFilterOptions = () => {
  cy.get(usersSelector.userFilterInput).click();
  ["All", "Active", "Invited", "Archived"].forEach((opt) => {
    cy.contains(opt).should("be.visible");
  });
  cy.get("body").click(0, 0);
};

/**
* @tjType   instanceUser.verifyRow
* @tjBlock  superAdmin
* @tjUsage  verifyUserRow(email, name, status)
* @tjDom    user row by email
*/
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

/**
* @tjType   instanceUser.openResetPassword
* @tjBlock  superAdmin
* @tjUsage  openResetPasswordModal()
* @tjDom    row action menu -> reset password
*/
export const openResetPasswordModal = () => {
  cy.get(instanceAllUsersSelectors.resetPasswordButton).click();
};

/**
* @tjType   instanceUser.verifyResetPasswordModal
* @tjBlock  superAdmin
* @tjUsage  verifyResetPasswordModalUI(userEmail)
* @tjDom    modal copy + buttons
*/
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
  // cy.contains("Password should be at least 5 characters").should("be.visible");
  cy.get(commonSelectors.cancelButton).should("be.visible");
  cy.get('[data-cy="reset-button"]').should("be.visible");
  cy.get(commonSelectors.cancelButton).click();
};

/**
* @tjType   instanceUser.verifyRowMenu
* @tjBlock  superAdmin
* @tjUsage  verifyUserActionMenu(userEmail)
* @tjDom    row kebab menu options
*/
export const verifyUserActionMenu = (userEmail) => {
  openUserActionMenu(userEmail);
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

/**
* @tjType   instanceUser.openArchiveModal
* @tjBlock  superAdmin
* @tjUsage  openArchiveUserModal('QA User')
* @tjDom    row menu -> archive
*/
export const openArchiveUserModal = (userName) => {
  openUserActionMenu(userName);
  cy.get(instanceAllUsersSelectors.archiveUserButton).click();
};

/**
* @tjType   instanceUser.verifyArchiveModal
* @tjBlock  superAdmin
* @tjUsage  verifyArchiveUserModalUI('QA User', userEmail)
* @tjDom    archive modal copy + buttons
*/
export const verifyArchiveUserModalUI = (userName, userEmail) => {
  openArchiveUserModal(userEmail);
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
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "User has been archived from this instance successfully!"
  );
  cy.wait(1000);
  cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement(
    "have.text",
    "archived"
  );

};

/**
* @tjType   instanceUser.openEditModal
* @tjBlock  superAdmin
* @tjUsage  openEditUserModal(userEmail)
* @tjDom    row menu -> edit
*/
export const openEditUserModal = (userEmail) => {
  openUserActionMenu(userEmail);
  cy.get(instanceAllUsersSelectors.editUserDetailsButton).click();
};

/**
* @tjType   instanceUser.updateName
* @tjBlock  superAdmin
* @tjUsage  updateUserNameAndVerifyChanges({ email, firstName, lastName })
* @tjDom    edit modal -> name fields -> save -> assert row
*/
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

/**
* @tjType   instanceUser.unarchive
* @tjBlock  superAdmin
* @tjUsage  verifyUnarchiveUserModal('QA User', userEmail)
* @tjDom    archived tab -> unarchive -> assert
*/
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

/**
* @tjType   session.loginAs
* @tjBlock  onboarding
* @tjUsage  loginAsUser(userEmail)
* @tjDom    UI login as the given user
*/
export const loginAsUser = (email, password = usersText.password) => {
  cy.visit("/my-workspace");
  cy.waitForElement(onboardingSelectors.signupEmailInput);
  cy.wait(500);
  cy.clearAndType(onboardingSelectors.signupEmailInput, email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
  cy.get(onboardingSelectors.signInButton).click();
};

/**
* @tjType   session.loginExpectToast
* @tjBlock  onboarding
* @tjUsage  loginAndExpectToast(userEmail, 'Invalid credentials')
* @tjDom    UI login asserting a failure toast
*/
export const loginAndExpectToast = (email, message, password = usersText.password) => {
  loginAsUser(email, password);
  cy.verifyToastMessage(commonSelectors.toastMessage, message);
};

/**
* @tjType   instanceUser.visitAs
* @tjBlock  superAdmin
* @tjUsage  visitAllUsersPage(adminEmail)
* @tjDom    logs in then opens All users
*/
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