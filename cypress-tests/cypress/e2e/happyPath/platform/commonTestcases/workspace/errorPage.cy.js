import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";

import { fake } from "Fixtures/fake";
import {
    logout,
    navigateToManageGroups,
    releaseApp,
} from "Support/utils/common";
import { commonText } from "Texts/common";

describe("Redirection error pages", () => {
    const data = {};

    beforeEach(() => {
        cy.apiLogin();
    });

    it("Verify error modal in case of invalid app URL", () => {
        data.lastName = fake.lastName.toLowerCase();
        data.appName = `${fake.companyName} App`;

        cy.visit(`/applications/${data.lastName}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "Invalid link"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "The link you provided is invalid. Please check the link and try again."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");
        cy.logoutApi();
        cy.wait(3000);

        cy.apiLogin("test@tooljet.com", "password");
        cy.visit(`/applications/${data.lastName}`);
        cy.get(commonSelectors.backToHomeButton).click();

    });

    it("Verify error message in case of restricted access", () => {
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
        data.appName = `${fake.companyName} App`;
        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.wait(1000);
        releaseApp();
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.wait(1000);
        cy.logoutApi();
        cy.apiLogin("test@tooljet.com", "password");
        cy.visit(`/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "Invalid link"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "The link you provided is invalid. Please check the link and try again."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.url().should("eq", `${Cypress.config('baseUrl')}/error/invalid-link`);

        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");
    });

    it("Verify error modal for app url of unreleased apps", () => {
        data.appName = `${fake.companyName} App`;
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.get(commonSelectors.leftSideBarSettingsButton).click();
        cy.get(commonWidgetSelector.appSlugInput).clear();
        cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
        cy.wait(1000);

        cy.visit(`${Cypress.config('baseUrl')}/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "App URL Unavailable"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "The app URL is currently unavailable because the app has not been released. Please either release it or contact admin for access."
        );
        cy.get('[data-cy="open-app-button"]').verifyVisibleElement(
            "have.text",
            "Open app"
        );

        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );

        cy.url().should('contain', '/error/')
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");

        cy.logoutApi();
        cy.apiLogin("test@tooljet.com", "password");
        cy.wait(500);

        cy.visit(`${Cypress.config('baseUrl')}/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "App URL Unavailable"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "The app URL is currently unavailable because the app has not been released. Please either release it or contact admin for access."
        );

        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.url().should('contain', '/error/')
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");
        logout();
        cy.apiLogin("test@tooljet.com", "password");
        cy.wait(500);

        cy.visit(`${Cypress.config('baseUrl')}/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "App URL Unavailable"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "The app URL is currently unavailable because the app has not been released. Please either release it or contact admin for access."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
<<<<<<< HEAD
        cy.url().should(
            "eq",
<<<<<<< HEAD
            `${Cypress.config('baseUrl')}/error/url-unavailable?appSlug=${data.slug}`
=======
            `http://localhost:8082/error/restricted`
>>>>>>> main
        );
=======
        cy.url().should('contain', '/error/')
>>>>>>> main
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");
    });
});