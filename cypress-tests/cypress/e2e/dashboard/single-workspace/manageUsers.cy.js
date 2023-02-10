import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { usersText } from "Texts/manageUsers";
import * as users from "Support/utils/manageUsers";
import * as common from "Support/utils/common";
import { path } from "Texts/common";
import { commonText } from "Texts/common";

const data = {};
data.firstName = fake.firstName;
data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Manage Users for single workspace", () => {
  beforeEach(() => {
    cy.appUILogin();
  });
  it("Should verify the Manage users page", () => {
    common.navigateToManageUsers();
    users.manageUsersElements();

    cy.get(usersSelector.cancelButton).click();
    cy.get(usersSelector.usersElements.nameTitile).should("be.visible");
    cy.get(usersSelector.inviteUserButton).click();

    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.fisrtNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );
    cy.get(usersSelector.lastNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.clearAndType(usersSelector.firstNameInput, data.firstName);
    cy.get(usersSelector.lastNameInput).clear();
    cy.get(usersSelector.emailInput).clear();
    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.lastNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.get(usersSelector.firstNameInput).clear();
    cy.get(usersSelector.emailInput).clear();
    cy.clearAndType(usersSelector.lastNameInput, data.lastName);
    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.fisrtNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.get(usersSelector.firstNameInput).clear();
    cy.get(usersSelector.lastNameInput).clear();
    cy.clearAndType(usersSelector.emailInput, data.email);
    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.fisrtNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );
    cy.get(usersSelector.lastNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.get(usersSelector.firstNameInput).clear();
    cy.clearAndType(usersSelector.lastNameInput, data.lastName);
    cy.clearAndType(usersSelector.emailInput, data.email);
    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.fisrtNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.get(usersSelector.lastNameInput).clear();
    cy.clearAndType(usersSelector.firstNameInput, data.firstName);
    cy.clearAndType(usersSelector.emailInput, data.email);
    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.lastNameError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.get(usersSelector.emailInput).clear();
    cy.clearAndType(usersSelector.firstNameInput, data.firstName);
    cy.clearAndType(usersSelector.lastNameInput, data.lastName);
    cy.get(usersSelector.createUserButton).click();
    cy.get(usersSelector.emailError).verifyVisibleElement(
      "have.text",
      usersText.fieldRequired
    );

    cy.clearAndType(usersSelector.firstNameInput, data.firstName);
    cy.clearAndType(usersSelector.lastNameInput, data.lastName);
    cy.clearAndType(usersSelector.emailInput, usersText.adminUserEmail);
    cy.get(usersSelector.createUserButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.exsitingEmail
    );
  });

  it("Should verify the confirm invite page and new user account", () => {
    common.navigateToManageUsers();
    users.inviteUser(data.firstName, data.lastName, data.email);
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
    cy.get(commonSelectors.workspaceName).click();

    common.logout();
    cy.appUILogin();
    common.navigateToManageUsers();
    common.searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
    common.logout();
  });

  it("Should verify the archive functionality", () => {
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
        cy.get(usersSelector.userStatus, { timeout: 9000 }).should(
          "have.text",
          usersText.archivedStatus
        );
      });

    common.logout();
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Your account is not active"
    );

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

    cy.window().then((win) => {
      cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
    });
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td img").click();
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.inviteCopiedToast
    );

    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get(usersSelector.userStatus, { timeout: 9000 }).should(
          "have.text",
          usersText.invitedStatus
        );
      });

    cy.get("@copyToClipboardPrompt").then((prompt) => {
      common.logout();
      cy.visit(prompt.args[0][1]);
      cy.url().should("include", path.confirmInvite);
    });

    cy.get(usersSelector.acceptInvite).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Added to the workspace successfully."
    );
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
});
