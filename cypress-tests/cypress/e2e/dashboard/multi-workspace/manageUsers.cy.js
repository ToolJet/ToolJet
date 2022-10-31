import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { usersText } from "Texts/manageUsers";
import * as users from "Support/utils/manageUsers";
import * as common from "Support/utils/common";
import { path } from "Texts/common";

const data = {};
data.firstName = fake.firstName;
data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
data.companyName = fake.companyName;

describe("Manage Users for multiple workspace", () => {
  before(() => {
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
    cy.clearAndType(
      usersSelector.emailInput,
      usersText.usersElements.userEmail
    );
    cy.get(usersSelector.createUserButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.exsitingEmail
    );
  });

  it("Should verify the confirm invite page", () => {
    users.inviteUser(data.firstName, data.lastName, data.email);
    users.confirmInviteElements();

    cy.get(usersSelector.finishSetup).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.passwordErrToast
    );
    cy.get(usersSelector.passwordInput).should("have.value", "");
    cy.get(usersSelector.confirmPasswordInput).should("have.value", "");

    cy.clearAndType(usersSelector.firstNameField, data.firstName);
    cy.clearAndType(usersSelector.lastNameField, data.lastName);
    cy.clearAndType(usersSelector.workspaceField, data.companyName);
    cy.get(usersSelector.roleOptions).select("Developer");
    cy.clearAndType(usersSelector.passwordInput, usersText.password);
    cy.get(usersSelector.finishSetup).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.passwordErrToast
    );
    cy.get(usersSelector.passwordInput).should(
      "have.value",
      usersText.password
    );
    cy.get(usersSelector.confirmPasswordInput).should("have.value", "");

    cy.get(usersSelector.passwordInput).clear();
    cy.clearAndType(usersSelector.confirmPasswordInput, usersText.password);
    cy.wait(100);
    cy.get(usersSelector.finishSetup).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.passwordErrToast
    );
    cy.get(usersSelector.passwordInput).should("have.value", "");
    cy.get(usersSelector.confirmPasswordInput).should(
      "have.value",
      usersText.password
    );

    cy.clearAndType(usersSelector.passwordInput, usersText.password);
    cy.clearAndType(
      usersSelector.confirmPasswordInput,
      usersText.mismatchPassword
    );
    cy.get(usersSelector.finishSetup).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.passwordMismatchToast
    );
    cy.get(usersSelector.passwordInput).should(
      "have.value",
      usersText.password
    );
    cy.get(usersSelector.confirmPasswordInput).should(
      "have.value",
      usersText.mismatchPassword
    );

    cy.clearAndType(usersSelector.passwordInput, usersText.password);
    cy.clearAndType(usersSelector.confirmPasswordInput, usersText.password);
    cy.get(usersSelector.finishSetup).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.passwordSuccessToast
    );
    cy.url().should("include", path.loginPath);
  });

  it("should verify the new user account", () => {
    cy.login(data.email, usersText.password);
    cy.get(usersSelector.dropdownText).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    cy.get(usersSelector.dropdown).invoke("show");
    cy.get(usersSelector.arrowIcon).click();
    cy.contains(data.companyName).should("be.visible").click();
    cy.intercept("GET", "/assets/images/onboarding.svg").as(
      "emptyDashboardImage"
    );
    cy.get(usersSelector.emptyImage).should("be.visible");
    cy.wait("@emptyDashboardImage");
    common.logout();

    cy.appUILogin();
    common.navigateToManageUsers();
    common.manageUsersPagination(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
  });

  it("Should verify the archive functionality", () => {
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
    cy.clearAndType(commonSelectors.emailField, data.email);
    cy.clearAndType(commonSelectors.passwordField, usersText.password);
    cy.get(commonSelectors.signInButton).click();
    cy.get(usersSelector.dropdown).invoke("show");
    cy.get(usersSelector.arrowIcon).click();
    cy.contains("My workspace").should("not.exist");
    common.logout();

    cy.appUILogin();
    common.navigateToManageUsers();
    common.manageUsersPagination(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td button").click();
      });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.unarchivedToast
    );

    cy.wait(1000);
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
    cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
    cy.url().should("include", path.loginPath);

    cy.appUILogin();
    common.navigateToManageUsers();
    common.manageUsersPagination(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
      });
  });
});
