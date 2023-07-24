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

const data = {};
data.firstName = fake.firstName;
data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
data.groupName = fake.firstName.replaceAll("[^A-Za-z]", "");

describe("Manage Users", () => {
  beforeEach(() => {
    cy.appUILogin();
  });
  let invitationToken,
    organizationToken,
    workspaceId,
    userId,
    url = "";
  it("Should verify the Manage users page", () => {
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
    common.navigateToManageUsers();
    users.inviteUser(data.firstName, data.email);
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
    cy.appUILogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
  });

  it("Should verify the user archive functionality", () => {
    common.navigateToManageUsers();

    common.searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td button").click();
      });
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
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.loginButton).click();

    updateWorkspaceName(data.email);
    cy.get(commonSelectors.workspaceName).click();
    cy.contains("My workspace").should("not.exist");
    common.logout();

    cy.appUILogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td button").click();
      });
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

    cy.appUILogin();
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
    common.navigateToManageUsers();

    users.fillUserInviteForm(data.firstName, data.email);
    cy.get(".dropdown-heading-value > .gray").click();
    cy.clearAndType(".search > input", "Test");
    cy.get(".no-options").verifyVisibleElement("have.text", "No options");
    users.selectUserGroup("Admin");
    cy.get(".dropdown-heading-value > span").verifyVisibleElement(
      "have.text",
      "Admin"
    );
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(".dropdown-heading-value > .gray").verifyVisibleElement(
      "have.text",
      "Select groups to add for this user"
    );
    cy.get(commonSelectors.cancelButton).click();

    users.inviteUserWithUserGroup(
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
      groupsText.groupCreatedToast)

    common.navigateToManageUsers();
    users.inviteUserWithUserGroup(
      data.firstName,
      data.email,
      "All users",
      data.groupName
    );
    common.logout()

    cy.appUILogin()
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink(data.groupName)).click();
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.userRow(data.email)).should("be.visible");
  });
});
