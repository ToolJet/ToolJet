import {
  commonEeSelectors,
  instanceSettingsSelector,
} from "Constants/selectors/eeCommon";
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { cleanAllUsers } from "Support/utils/manageUsers";
import {
  openEditUserModal,
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
    cy.apiDeleteAllWorkspaces();
    cy.visit("/my-workspace");
    cleanAllUsers();
    cy.apiFullUserOnboarding(data.userName, data.userEmail, "admin");
    cy.apiLogout();
    visitAllUsersPage();
  });

  it("verifies superadmin promotion and password login", () => {
    //Promote to superadmin and verify login
    openEditUserModal(data.userEmail);
    cy.get(instanceSettingsSelector.superAdminToggle).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Changes updated successfully!"
    );
    cy.apiLogout();

    visitAllUsersPage(data.userEmail);
    cy.get('[data-cy="title-users-page"]').should(
      "have.text",
      "Manage all users"
    );
    cy.get(instanceSettingsSelector.userType(data.userName)).should(
      "have.text",
      "instance"
    );
    cy.apiLogout();

    //Demote to workspace admin and verify login
    visitAllUsersPage();
    openEditUserModal(data.userEmail);
    cy.get(instanceSettingsSelector.superAdminToggle).uncheck();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Changes updated successfully!"
    );
    cy.apiLogout();

    cy.apiLogin(data.userEmail);
    cy.visit("/my-workspace");
    cy.waitForElement(commonSelectors.settingsIcon);
    cy.wait(500);
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonEeSelectors.instanceSettingsIcon).should("not.exist");
  });
});
