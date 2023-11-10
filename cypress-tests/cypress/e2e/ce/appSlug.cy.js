import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, navigateToAppEditor, verifyTooltip, releaseApp } from "Support/utils/common";
import { commonText } from "Texts/common";
import { addNewUserMW } from "Support/utils/userPermissions";
import { userSignUp } from "Support/utils/onboarding";

describe("App share functionality", () => {
    const data = {};
    data.appName = `${fake.companyName} App`;
    data.firstName = fake.firstName;
    data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
    data.email = fake.email.toLowerCase();
    const slug = data.appName.toLowerCase().replace(/\s+/g, "-");
    const firstUserEmail = data.email
    const envVar = Cypress.env("environment");
    // beforeEach(() => {
    //     cy.appUILogin();
    // });
    before(() => {
        cy.apiLogin();
        cy.apiCreateApp(data.appName);
        // cy.visit('/')
        // logout();
    })

    it("", () => {
        cy.openApp(data.appName);

        cy.get('[data-cy="left-sidebar-settings-button"]').click();
        cy.get('[data-cy="app-slug-label"]').verifyVisibleElement("have.text", "Unique app slug");
        cy.get('[data-cy="app-slug-input-field"]').verifyVisibleElement("have.value", Cypress.env("appId"));
        cy.get('[data-cy="app-slug-info-label"]').verifyVisibleElement("have.text", "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens");
        cy.get('[data-cy="app-link-label"]').verifyVisibleElement("have.text", "App link");
        cy.get('[data-cy="app-link-field"]').verifyVisibleElement("have.text", `http://localhost:8082/my-workspace/apps/${Cypress.env("appId")}`)

    })

});