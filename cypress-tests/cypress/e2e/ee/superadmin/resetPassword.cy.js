import { commonSelectors } from "Selectors/common";
import { addNewUser } from "Support/utils/onboarding";
import { fake } from "Fixtures/fake";

describe("", () => {
    const data = {};

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });
    it("", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        let newPassword;
        addNewUser(data.firstName, data.email);
        cy.logoutApi();

        cy.defaultWorkspaceLogin();
        cy.get(commonSelectors.settingsIcon).click();
        cy.get('[href="/instance-settings"]').click();

        cy.clearAndType(commonSelectors.inputUserSearch, data.email);
        cy.wait(1000)
        cy.get('[data-cy="user-actions-button"]').click();
        cy.get('[data-cy="reset-password-button"]').click();

        cy.get('[data-cy="reset-password-title"]').verifyVisibleElement("have.text", "Reset password")
        cy.get('[data-cy="user-email"]').verifyVisibleElement("have.text", data.email)
        cy.get('[data-cy="modal-close-button"]').should("be.visible")
        cy.get('[data-cy="automatically-generate-a-password-input"]').should("be.visible")
        cy.verifyLabel("Automatically generate a password")
        cy.get('[data-cy="helper-text"]').verifyVisibleElement("have.text", "You will be able to view and copy the password in the next step")
        cy.get('[data-cy="create-password-input"]').should("be.visible")
        cy.verifyLabel("Create password")
        cy.get('[data-cy="cancel-button"]').verifyVisibleElement("have.text", "Cancel")
        cy.get('[data-cy="reset-button"]').verifyVisibleElement("have.text", "Reset")

        cy.task("updateId", {
            dbconfig: Cypress.env("app_db"),
            sql: `select id from users where email='${data.email}';`,
        }).then((resp) => {
            const userId = resp.rows[0].id;
            cy.intercept("PATCH", `http://localhost:3000/api/users/${userId}/password/generate`).as("pwd")
            cy.get('[data-cy="reset-button"]').click();
        })
        cy.verifyToastMessage(commonSelectors.toastMessage, "Password reset successful")
        cy.get('[data-cy="reset-password-title"]').verifyVisibleElement("have.text", "Reset password")
        cy.get('[data-cy="modal-close-button"]').should("be.visible")
        cy.verifyLabel("Password")
        cy.get('[data-cy="show-password-icon"]').should("be.visible")
        cy.get('[data-cy="copy-path-to-clipboard"]').should("be.visible")
        cy.get('[data-cy="done-button"]').verifyVisibleElement("have.text", "Done")

        cy.wait('@pwd').then((res) => {
            newPassword = res.response.body.newPassword;

            cy.get('[data-cy="password-input"]').verifyVisibleElement("have.value", newPassword)

            cy.logoutApi();
            cy.visit('/my-workspace')
            cy.clearAndType(commonSelectors.workEmailInputField, data.email);
            cy.clearAndType(commonSelectors.passwordInputField, "password");
            cy.get(commonSelectors.signInButton).click();
            cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid credentials")

            cy.clearAndType(commonSelectors.workEmailInputField, data.email);
            cy.clearAndType(commonSelectors.passwordInputField, newPassword);
            cy.get(commonSelectors.signInButton).click();
        })
        cy.get('[data-cy="dashboard-section-header"]').should("be.visible")
        cy.logoutApi();

        cy.defaultWorkspaceLogin();
        cy.get(commonSelectors.settingsIcon).click();
        cy.get('[href="/instance-settings"]').click();

        cy.clearAndType(commonSelectors.inputUserSearch, data.email);
        cy.wait(1000)
        cy.get('[data-cy="user-actions-button"]').click();
        cy.get('[data-cy="reset-password-button"]').click();
        cy.get('[data-cy="create-password-input"]').check();

        cy.get('[data-cy="password-input"]').verifyVisibleElement("have.attr", "placeholder", "Enter password")
        cy.get('[data-cy="show-password-icon"]').should("be.visible")
        cy.get('[data-cy="password-helper-text"]').verifyVisibleElement("have.text", "Password should be at least 5 characters")

        cy.clearAndType('[data-cy="password-input"]', "newPassword")
        cy.get('[data-cy="reset-button"]').click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Password reset successful")

        cy.logoutApi();
        cy.visit('/my-workspace')
        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.signInButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid credentials")

        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, "newPassword");
        cy.get(commonSelectors.signInButton).click();
        cy.get('[data-cy="dashboard-section-header"]').should("be.visible")


    })
})