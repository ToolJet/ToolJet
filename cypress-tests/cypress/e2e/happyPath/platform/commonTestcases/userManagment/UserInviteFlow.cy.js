import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import {
  manageUsersElements,
  fillUserInviteForm,
  confirmInviteElements,
  selectUserGroup,
  inviteUserWithUserGroups,
  inviteUserWithUserRole,
  fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import { visitWorkspaceInvitation, addNewUser } from "Support/utils/onboarding";

import {
  navigateToManageUsers,
  logout,
  searchUser,
  navigateToManageGroups,
} from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { onboardingSelectors } from "Selectors/onboarding";
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
      enableInstanceSignup()
    });
  });

  it("Should verify the Manage users page", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    navigateToManageUsers();

    manageUsersElements();

    cy.get(commonSelectors.cancelButton).click();
    cy.get(usersSelector.usersPageTitle).should("be.visible");
    cy.get(usersSelector.buttonAddUsers).click();

    cy.get(usersSelector.buttonInviteUsers).should("be.disabled");

    cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
    cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
    cy.get(commonSelectors.inputFieldEmailAddress).clear();
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      "Email is not valid"
    );
    cy.get(usersSelector.buttonInviteUsers).should("be.disabled");

    cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
    cy.clearAndType(
      commonSelectors.inputFieldEmailAddress,
      usersText.adminUserEmail
    );
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
    cy.wait(2000);
    fetchAndVisitInviteLink(data.email);
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
    cy.get('[data-cy="user-group-select"]>>>>>').dblclick();
    cy.get("body").then(($body) => {
      if (!$body.find('[data-cy="user-group-select"]>>>>>').length > 0) {
        cy.get('[data-cy="user-group-select"]>>>>>').click();
      }
    });
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Test");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    selectUserGroup("Admin");
    cy.get(".selected-value").verifyVisibleElement("have.text", "Admin");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(".selected-value").should("have.text", "End-user");
    cy.get(commonSelectors.cancelButton).click();

    inviteUserWithUserRole(data.firstName, data.email, "Admin");

    navigateToManageGroups();
    cy.get(groupsSelector.groupLink("Admin")).click();
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.userRow(data.email)).should("be.visible");

    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, data.groupName1);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupCreatedToast
    );
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, data.groupName2);
    cy.get(groupsSelector.createGroupButton).click();

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
    cy.get(commonSelectors.homePageLogo, { timeout: 10000 }).should("be.visible");

    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(data.groupName1)).click();
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.userRow(data.email)).should("be.visible");
    cy.get(groupsSelector.groupLink(data.groupName2)).click();
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.userRow(data.email)).should("be.visible");
  });

  it("Should verify the edit user feature", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

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
    cy.get(usersSelector.addUsersCardTitle).verifyVisibleElement(
      "have.text",
      "Edit user details"
    );
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
    cy.get(commonSelectors.groupInputFieldLabel).verifyVisibleElement(
      "have.text",
      "User groups"
    );
    cy.get('[data-cy="user-group-select"]>>>>>').should("be.visible");
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(usersSelector.buttonInviteUsers).verifyVisibleElement(
      "have.text",
      "Update"
    );

    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(usersSelector.buttonInviteUsers).click();

    cy.get('[data-cy="modal-title"] > .tj-text-md').verifyVisibleElement(
      "have.text",
      "Edit user role"
    );
    cy.get('[data-cy="user-email"]').verifyVisibleElement(
      "have.text",
      data.email
    );

    if (envVar === "Enterprise") {
      cy.get('[data-cy="modal-body"]>').verifyVisibleElement(
        "have.text",
        "Changing user default group from end-user to admin will affect the count of users covered by your plan.Are you sure you want to continue?"
      );
    } else {
      cy.get('[data-cy="modal-body"]>').verifyVisibleElement(
        "have.text",
        "Changing the user role from end-user to admin will grant the user access to all resources and settings.Are you sure you want to continue?"
      );
    }

    cy.get('.modal-footer > [data-cy="cancel-button"]').verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get('[data-cy="confim-button"]').verifyVisibleElement(
      "have.text",
      "Continue"
    );
    cy.get('[data-cy="modal-close-button"]').should("be.visible").click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get('.modal-footer > [data-cy="cancel-button"]').click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get('[data-cy="confim-button"]').click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User has been updated"
    );
    searchUser(data.email);
    cy.get('[data-name="role-header"] [data-cy="group-chip"]').should(
      "have.text",
      "Admin"
    );

    cy.get(usersSelector.userActionButton).click();
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Builder");
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get('[data-cy="confim-button"]').click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User has been updated"
    );
    searchUser(data.email);
    cy.get('[data-name="role-header"] [data-cy="group-chip"]').should(
      "have.text",
      "Builder"
    );
  });
});
