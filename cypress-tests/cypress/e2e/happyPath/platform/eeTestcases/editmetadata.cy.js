
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { inviteUserWithUserRoleAndMetadata } from "Support/utils/manageUsers";
import {
    navigateToManageUsers,
    logout,
} from "Support/utils/common";

describe("User Metadata and Validation", () => {
    const name = "Test User";
    const email = `testuser+${Date.now()}@example.com`;
    const metadata = {
        department: "Engineering",
        value: "QA",
    };
    const data = {};

    beforeEach(() => {

        cy.apiLogin();
        cy.visit("/");
    });

    it("should invite user with metadata and validate values", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        navigateToManageUsers();
        inviteUserWithUserRoleAndMetadata("test", email, "admin");
        // cy.apiLogin();
        cy.visit("/");

        navigateToManageUsers();
        cy.get(usersSelector.userActionButton).eq(0).click();
        cy.get(usersSelector.editUserDetailsButton).eq(0).click();
        cy.get('[data-cy="icon-hidden"]').click();
        cy.get('[placeholder="Value"]')
            .first()
            .clearAndTypeOnCodeMirror('test', 'test2');
        cy.get('[data-cy="button-invite-users"]').click();

    });
});