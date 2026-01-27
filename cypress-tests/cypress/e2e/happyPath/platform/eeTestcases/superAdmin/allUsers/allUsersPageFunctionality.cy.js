import { instanceSettingsSelector } from "Constants/selectors/eeCommon";
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { cleanAllUsers } from "Support/utils/manageUsers";
import {
  loginAndExpectToast,
  verifyArchiveUserModalUI,
  verifyUnarchiveUserModal,
  visitAllUsersPage,
} from "Support/utils/platform/allUsers";
import { sanitize } from "Support/utils/common";

const data = {
  userName: sanitize(fake.firstName),
  get userEmail() {
    return `${this.userName}@example.com`;
  },
};

describe("Instance Settings - All Users UI", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/my-workspace");
    cleanAllUsers();
    cy.apiFullUserOnboarding(data.userName, data.userEmail, "admin");
    cy.apiLogout();
    visitAllUsersPage();
  });

  it("verifies archive from instance and workspace functionality", () => {
    //Instance level archive and login verification
    verifyArchiveUserModalUI(data.userName, data.userEmail);
    cy.apiLogout();

    cy.wait(2000);
    loginAndExpectToast(
      data.userEmail,
      "You have been archived from this instance. Contact super admin to know more."
    );

    //Workspace level unarchive and login verification
    visitAllUsersPage();
    verifyUnarchiveUserModal(data.userName, data.userEmail);
    cy.apiLogout();

    cy.wait(2000);
    loginAndExpectToast(
      data.userEmail,
      "You have been archived from this workspace. Sign in to another workspace or contact admin to know more."
    );

    //Workspace level unarchive and login verification
    visitAllUsersPage();
    cy.waitForElement(commonSelectors.inputUserSearch);
    cy.clearAndType(commonSelectors.inputUserSearch, data.userEmail);
    cy.get(instanceSettingsSelector.viewButton(data.userName)).click();
    cy.get(instanceSettingsSelector.userStatusChangeButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "The user has been unarchived"
    );
    cy.apiLogout();

    cy.wait(2000);
    loginAndExpectToast(data.userEmail, "Invalid credentials");
  });
});
