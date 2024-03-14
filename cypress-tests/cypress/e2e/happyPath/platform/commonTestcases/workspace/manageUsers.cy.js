import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import * as users from "Support/utils/manageUsers";
import * as common from "Support/utils/common";
import { path } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { updateWorkspaceName } from "Support/utils/userPermissions";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { addNewUser } from "Support/utils/onboarding";

const data = {};
data.groupName = fake.firstName.replaceAll("[^A-Za-z]", "");

describe("Manage Users", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });
  let invitationToken,
    organizationToken,
    workspaceId,
    userId,
    url = "";
  it("Should verify the Manage users page", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    common.navigateToManageUsers();

    users.manageUsersElements();

    cy.get(commonSelectors.cancelButton).click();
    cy.get(usersSelector.usersPageTitle).should("be.visible");
    cy.get(usersSelector.buttonAddUsers).click();

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get(usersSelector.fullNameError).verifyVisibleElement(
      "have.text",
      usersText.errorTextFieldRequired
    );
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      usersText.errorTextFieldRequired
    );

    cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
    cy.get(commonSelectors.inputFieldEmailAddress).clear();
    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      usersText.errorTextFieldRequired
    );

    cy.get(commonSelectors.inputFieldFullName).clear();
    cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
    cy.get(usersSelector.buttonInviteUsers).click();
    cy.get(usersSelector.fullNameError).verifyVisibleElement(
      "have.text",
      usersText.errorTextFieldRequired
    );

    cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
    cy.clearAndType(
      commonSelectors.inputFieldEmailAddress,
      usersText.adminUserEmail
    );
    cy.get(usersSelector.buttonInviteUsers).click();

    cy.get(commonSelectors.newToastMessage).should(
      "have.text",
      usersText.exsitingEmail
    );
  });

  it("Should verify the confirm invite page and new user account", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    cy.removeAssignedApps();

    common.navigateToManageUsers();
    users.fillUserInviteForm(data.firstName, data.email);
    cy.get(usersSelector.buttonInviteUsers).click();
    cy.wait(2000);
    users.fetchAndVisitInviteLink(data.email);
    users.confirmInviteElements();

    cy.clearAndType(commonSelectors.passwordInputField, "pass");
    cy.get(commonSelectors.acceptInviteButton).should("be.disabled");
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.acceptInviteButton).should("not.be.disabled");
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    updateWorkspaceName(data.email);

    common.logout();
    cy.defaultWorkspaceLogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
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
    cy.logoutApi();

    cy.defaultWorkspaceLogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
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

    common.logout();
    cy.visit("/");
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.loginButton).click();

    updateWorkspaceName(data.email);
    cy.get(commonSelectors.workspaceName).click();
    cy.contains("My workspace").should("not.exist");
    common.logout();

    cy.defaultWorkspaceLogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
    cy.wait(1000);
    cy.get(usersSelector.userActionButton).click();
    cy.get('[data-cy="archive-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.unarchivedToast
    );

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select invitation_token from users where email='${data.email}';`,
    }).then((resp) => {
      invitationToken = resp.rows[0].invitation_token;

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: "select id from organizations where name='My workspace';",
      }).then((resp) => {
        workspaceId = resp.rows[0].id;

        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: `select id from users where email='${data.email}';`,
        }).then((resp) => {
          userId = resp.rows[0].id;

          cy.task("updateId", {
            dbconfig: Cypress.env("app_db"),
            sql: `select invitation_token from organization_users where user_id='${userId}';`,
          }).then((resp) => {
            organizationToken = resp.rows[1].invitation_token;

            url = `/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}`;

            cy.contains("td", data.email)
              .parent()
              .within(() => {
                cy.get("td small").should("have.text", usersText.invitedStatus);
              });
            common.logout();
            cy.wait(500);
            cy.visit(url);
          });
        });
      });
    });

    cy.get(usersSelector.acceptInvite).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
    cy.url().should("include", path.loginPath);

    cy.defaultWorkspaceLogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
  });

  it("Should verify the user onboarding with groups", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    const groupNames = ["All users", "Admin"];

    common.navigateToManageUsers();

    users.fillUserInviteForm(data.firstName, data.email);
    cy.wait(1500);
    cy.get('[data-cy="user-group-select"]>>>>>').dblclick();
    cy.get("body").then(($body) => {
      if (!$body.find('[data-cy="user-group-select"]>>>>>').length > 0) {
        cy.get('[data-cy="user-group-select"]>>>>>').click();
      }
    });
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Test");
    cy.get(".css-1wlit7h-NoOptionsMessage").verifyVisibleElement(
      "have.text",
      "No groups found"
    );
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    users.selectUserGroup("Admin");
    cy.get(".selected-value").verifyVisibleElement("have.text", "Admin");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(".css-1jqq78o-placeholder").should(
      "have.text",
      "Select groups to add for this user"
    );
    cy.get(commonSelectors.cancelButton).click();

    users.inviteUserWithUserGroups(
      data.firstName,
      data.email,
      "All users",
      "Admin"
    );

    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink("Admin")).click();
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.userRow(data.email)).should("be.visible");

    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, data.groupName);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupCreatedToast
    );

    common.navigateToManageUsers();
    users.inviteUserWithUserGroups(
      data.firstName,
      data.email,
      "All users",
      data.groupName
    );
    common.logout();

    cy.defaultWorkspaceLogin();
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink(data.groupName)).click();
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.userRow(data.email)).should("be.visible");
  });

  it("Should verify the edit user feature", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

    addNewUser(data.firstName, data.email);
    cy.logoutApi();

    cy.defaultWorkspaceLogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
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
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "User has been updated"
    );

    common.searchUser(data.email);
    cy.get(usersSelector.groupChip).eq(1).should("have.text", "Admin");
  });
});
