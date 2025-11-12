import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { instanceWorkspaceSelectors } from "Selectors/superAdminSelectors";
import { cleanAllUsers } from "Support/utils/manageUsers";
import {
    updateUserNameAndVerifyChanges,
    verifyAllUsersHeaderUI,
    verifyResetPasswordModalUI,
    verifyTableControls,
    verifyUserActionMenu,
    verifyUserRow,
    verifyUsersFilterOptions,
} from "Support/utils/platform/allUsers";

const data = {
    userName: fake.firstName.toLowerCase().replace(/[^a-z]/g, ""),
    userEmail: fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, ""),
};

describe("Instance Settings - All Users UI", () => {
    beforeEach(() => {
        cy.apiLogin();
        cleanAllUsers();
        cy.apiFullUserOnboarding(data.userName, data.userEmail, "admin");
        cy.apiLogout();
        cy.apiLogin();
        cy.visit("settings/all-users");
    });

    it("verifies All Users UI and updates user name", () => {
        const updatedName = fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
        verifyAllUsersHeaderUI();
        verifyTableControls();
        verifyUsersFilterOptions();
        cy.get(commonSelectors.avatarImage).should("be.visible");
        cy.clearAndType(instanceWorkspaceSelectors.userSearchBar, data.userEmail);

        verifyUserRow(data.userName, data.userEmail, "workspace", "active");
        verifyUserActionMenu(data.userName);

        verifyResetPasswordModalUI(data.userEmail);

        updateUserNameAndVerifyChanges({
            currentName: data.userName,
            userEmail: data.userEmail,
            newName: updatedName,
        });
    });
});
