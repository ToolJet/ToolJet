import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { instanceWorkspaceSelectors } from "Selectors/superAdminSelectors";
import {
  openAllUsersPage,
  verifyAllUsersHeaderUI,
  verifyTableControls,
  verifyUsersFilterOptions,
  verifyUserRow,
  verifyUserActionMenu,
  verifyResetPasswordModalUI,
  verifyArchiveUserModalUI,
  updateUserNameAndVerifyChanges,
  verifyUnarchiveUserModal,
} from "Support/utils/superAdminAllUsers";

const userName = () => fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
const userEmail = () => fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, "");

describe("Instance Settings - All Users UI", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });

  it("verifies All Users UI and updates user name", () => {
    const user = { name: userName(), email: userEmail() };
    const updatedName = fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
    cy.apiFullUserOnboarding(user.name, user.email);

    cy.apiLogin();
    openAllUsersPage();

    verifyAllUsersHeaderUI();
    verifyTableControls();
    verifyUsersFilterOptions();
    cy.get(commonSelectors.avatarImage).should("be.visible");
    cy.clearAndType(instanceWorkspaceSelectors.userSearchBar, user.email);

    verifyUserRow(user.name, user.email, "workspace", "active");
    verifyUserActionMenu(user.name);
    verifyResetPasswordModalUI(user.email);
    verifyArchiveUserModalUI(user.email);
    updateUserNameAndVerifyChanges({ currentName: user.name, userEmail: user.email, newName: updatedName });
    verifyUnarchiveUserModal(user.email)
  });
});
