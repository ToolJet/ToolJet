import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { usersSelector } from "Selectors/manageUsers";
import {
  confirmInviteElements,
  fetchAndVisitInviteLinkViaMH,
  fillUserInviteForm,
  inviteUserWithUserGroups,
  inviteUserWithUserRole,
  selectGroup,
  selectUserGroup,
  updateUserGroup,
  verifyManageUsersPageElements,
} from "Support/utils/manageUsers";
import { addNewUser, visitWorkspaceInvitation } from "Support/utils/onboarding";
import { commonText } from "Texts/common";
import { usersText } from "Texts/manageUsers";

import { onboardingSelectors } from "Selectors/onboarding";
import {
  fillInputField,
  logout,
  navigateToManageUsers,
  searchUser,
} from "Support/utils/common";
import { verifyUserInGroups } from "Support/utils/externalApi";
import { apiCreateGroup } from "Support/utils/manageGroups";
import { enableInstanceSignup } from "Support/utils/manageSSO";

let invitationToken,
  organizationToken,
  workspaceId,
  userId,
  url = "";

const data = {};
const envVar = Cypress.env("environment");

describe("user invite flow cases", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.ifEnv("Enterprise", () => {
      enableInstanceSignup();
    });
  });

  it("Should verify the Manage users page", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    navigateToManageUsers();
    verifyManageUsersPageElements();

    cy.get(commonSelectors.cancelButton).click();
    cy.get(usersSelector.usersPageTitle).should("be.visible");

    cy.get(usersSelector.buttonAddUsers, { timeout: 15000 }).click();
    cy.get(usersSelector.buttonInviteUsers).should("be.disabled");

    fillInputField({ Name: data.firstName, "Email address": data.email });
    cy.get(commonSelectors.inputFieldEmailAddress).clear();
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      "Email is not valid"
    );
    cy.get(usersSelector.buttonInviteUsers).should("be.disabled");

    fillInputField({
      Name: data.firstName,
      "Email address": usersText.adminUserEmail,
    });
    cy.get(usersSelector.buttonInviteUsers).click();

    cy.get('[data-cy="modal-icon"]').should("be.visible");
    cy.get('[data-cy="modal-header"]').verifyVisibleElement(
      "have.text",
      "Duplicate email"
    );
    cy.get(commonSelectors.modalMessage).verifyVisibleElement(
      "have.text",
      "Duplicate email found. Please provide a unique email address."
    );
    cy.get('[data-cy="close-button"]:eq(1)').should("be.visible").click();
    cy.get(commonSelectors.inputFieldEmailAddress).should(
      "have.value",
      usersText.adminUserEmail
    );
  });

  it("Should verify the confirm invite page and new user account", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

    navigateToManageUsers();
    fillUserInviteForm(data.firstName, data.email);
    cy.get(usersSelector.buttonInviteUsers).click();
    cy.wait(5000);
    cy.apiLogout();

    fetchAndVisitInviteLinkViaMH(data.email); //email invite get and visit
    confirmInviteElements(data.email);

    cy.clearAndType(onboardingSelectors.loginPasswordInput, "pass");
    cy.get(commonSelectors.signUpButton).should("be.disabled");
    cy.clearAndType(onboardingSelectors.loginPasswordInput, usersText.password);
    cy.get(commonSelectors.signUpButton).should("not.be.disabled");
    cy.get(commonSelectors.signUpButton).click();

    cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
      "have.text",
      commonText.invitePageHeader
    );
    cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
      "have.text",
      commonText.invitePageSubHeader
    );
    cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
      "have.text",
      data.firstName
    );
    cy.wait(3000);
    cy.get(commonSelectors.invitedUseremail).verifyVisibleElement(
      "have.text",
      data.email
    );
    cy.get(commonSelectors.acceptInviteButton)
      .verifyVisibleElement("have.text", commonText.acceptInviteButton)
      .click();
    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      "My workspace"
    );

    logout();
    cy.defaultWorkspaceLogin();
    navigateToManageUsers();
    searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
  });

  it("Should verify the user archive functionality", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

    addNewUser(data.firstName, data.email);

    cy.apiLogout();

    cy.defaultWorkspaceLogin();
    navigateToManageUsers();
    searchUser(data.email);
    cy.wait(1000);
    cy.get(usersSelector.userActionButton).click();
    cy.get('[data-cy="archive-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );

    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.archivedStatus);
      });

    logout();
    cy.visit("/");
    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, usersText.password);
    cy.get(onboardingSelectors.signInButton).click();

    cy.defaultWorkspaceLogin();
    navigateToManageUsers();
    searchUser(data.email);
    cy.wait(1000);
    cy.get(usersSelector.userActionButton).click();
    cy.get('[data-cy="archive-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.unarchivedToast
    );

    visitWorkspaceInvitation(data.email, "My workspace");

    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(onboardingSelectors.signInButton).click();
    cy.get(usersSelector.acceptInvite).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
    logout();

    cy.defaultWorkspaceLogin();
    navigateToManageUsers();
    searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
  });

  it("Should verify the user onboarding with groups", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.groupName1 = fake.firstName.replaceAll("[^A-Za-z]", "");
    data.groupName2 = fake.firstName.replaceAll("[^A-Za-z]", "");

    const groupNames = ["All users", "Admin"];

    navigateToManageUsers();

    fillUserInviteForm(data.firstName, data.email);
    cy.wait(1500);
    cy.get(usersSelector.groupSelector).dblclick();
    cy.get("body").then(($body) => {
      if (!$body.find(usersSelector.groupSelector).length > 0) {
        cy.get(usersSelector.groupSelector).click();
      }
    });
    cy.get(usersSelector.groupSelector).eq(0).type("Test");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    selectUserGroup("Admin");
    cy.get(".selected-value").verifyVisibleElement("have.text", "Admin");
    cy.get(commonSelectors.cancelButton).click();

    // Verify default End-user role
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(".selected-value").should("have.text", "End-user");
    cy.get(commonSelectors.cancelButton).click();

    inviteUserWithUserRole(data.firstName, data.email, "Admin");

    verifyUserInGroups(data.email, ["Admin"]);

    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

    apiCreateGroup(data.groupName1);
    apiCreateGroup(data.groupName2);

    navigateToManageUsers();
    inviteUserWithUserGroups(
      data.firstName,
      data.email,
      data.groupName1,
      data.groupName2
    );
    logout();
    cy.wait(1000);

    cy.defaultWorkspaceLogin();
    cy.get(commonSelectors.homePageLogo, { timeout: 10000 }).should(
      "be.visible"
    );

    verifyUserInGroups(data.email, [data.groupName1, data.groupName2]);
  });

  it("Should verify the edit user feature", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.groupName = fake.firstName.replaceAll("[^A-Za-z]", "");

    apiCreateGroup(data.groupName);
    addNewUser(data.firstName, data.email);
    cy.apiLogout();

    cy.defaultWorkspaceLogin();
    navigateToManageUsers();
    searchUser(data.email);
    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).verifyVisibleElement(
      "have.text",
      "Edit user details"
    );
    cy.get('[data-cy="archive-button"]').verifyVisibleElement(
      "have.text",
      "Archive user"
    );

    cy.get(usersSelector.editUserDetailsButton).click();

    cy.get(commonSelectors.labelFullNameInput).verifyVisibleElement(
      "have.text",
      "Name"
    );
    cy.get(commonSelectors.inputFieldFullName).verifyVisibleElement(
      "have.value",
      data.firstName
    );
    cy.get(commonSelectors.labelEmailInput).verifyVisibleElement(
      "have.text",
      "Email address"
    );
    cy.get(commonSelectors.inputFieldEmailAddress).verifyVisibleElement(
      "have.value",
      data.email
    );
    cy.get('[data-cy="user-group-label"]').verifyVisibleElement(
      "have.text",
      "User groups"
    );
    cy.get(usersSelector.groupSelector).should("be.visible");
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(usersSelector.buttonInviteUsers).verifyVisibleElement(
      "have.text",
      "Update"
    );

    selectGroup("Admin");
    cy.get(commonSelectors.cancelButton).click();

    updateUserGroup("Admin");
    cy.get(usersSelector.buttonInviteUsers).click();

    cy.get('[data-cy="modal-title"] > .tj-text-md').verifyVisibleElement(
      "have.text",
      "Edit user role"
    );
    cy.get('[data-cy="user-email"]').verifyVisibleElement(
      "have.text",
      data.email
    );

    cy.get('[data-cy="modal-body"]>').verifyVisibleElement(
      "have.text",
      "Changing user default group from end-user to admin will affect the count of users covered by your plan.Are you sure you want to continue?"
    );

    cy.get('.modal-footer > [data-cy="cancel-button"]').verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get('[data-cy="confirm-button"]').verifyVisibleElement(
      "have.text",
      "Continue"
    );
    cy.get('[data-cy="modal-close-button"]').should("be.visible").click();

    updateUserGroup("Admin");

    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get(usersSelector.groupSelector).eq(0).type("Admin");
    cy.wait(1000);
    cy.get(usersSelector.groupSelectInput).eq(0).check();

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get('.modal-footer > [data-cy="cancel-button"]').click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get(usersSelector.groupSelector).eq(0).type("Admin");
    cy.wait(1000);
    cy.get(usersSelector.groupSelectInput).eq(0).check();

    cy.get(commonSelectors.cancelButton).click();

    updateUserGroup("Admin");

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get('[data-cy="confirm-button"]').click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User has been updated"
    );

    searchUser(data.email);
    cy.get('[data-name="role-header"] [data-cy="group-chip"]').should(
      "have.text",
      "Admin"
    );

    updateUserGroup("Builder");
    selectGroup(data.groupName);

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get('[data-cy="confirm-button"]').click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User has been updated"
    );
    searchUser(data.email);
    cy.get('[data-name="role-header"] [data-cy="group-chip"]').should(
      "have.text",
      "Builder"
    );
    verifyUserInGroups(data.email, [data.groupName]);
  });
});
