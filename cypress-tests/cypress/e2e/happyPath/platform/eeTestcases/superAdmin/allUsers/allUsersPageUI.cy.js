import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { instanceWorkspaceSelectors } from "Selectors/superAdminSelectors";
import { sanitize } from "Support/utils/common";
import { cleanAllUsers } from "Support/utils/manageUsers";
import {
    openAllUsersPage,
    updateUserNameAndVerifyChanges,
    verifyAllUsersHeaderUI,
    verifyResetPasswordModalUI,
    verifyTableControls,
    verifyUserActionMenu,
    verifyUserRow,
    verifyUsersFilterOptions,
} from "Support/utils/platform/allUsers";

const data = {
    userName: sanitize(fake.firstName),
    userEmail: sanitize(fake.email),
};

describe("Instance Settings - All Users UI", () => {
    beforeEach(() => {
        cy.apiLogin();
        cleanAllUsers();
        cy.apiFullUserOnboarding(data.userName, data.userEmail, "admin");
        cy.apiLogout();
        cy.apiLogin();
        cy.visit("/my-workspace");
        openAllUsersPage();
    });

    it("verifies All Users UI and updates user name", () => {
        const updatedName = sanitize(fake.firstName);

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
