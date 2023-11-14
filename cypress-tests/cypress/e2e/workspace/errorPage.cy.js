import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";

import { fake } from "Fixtures/fake";
import {
    logout,
    navigateToAppEditor,
    navigateToManageGroups,
    releaseApp,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { inviteUser } from "Support/utils/manageUsers";
import { userSignUp } from "Support/utils/onboarding";

describe("App share functionality", () => {
    const data = {};
    data.appName = `${fake.companyName} App`;
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();
    data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

    beforeEach(() => {
        cy.apiLogin();
    });
    before(() => {
        cy.apiLogin();
        inviteUser(data.firstName, data.email);

        logout();
    });

    it("Verify error modal in case of invalid app URL", () => {
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

        cy.visit(`/applications/${data.lastName}`);
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.workEmailLabel).should("be.visible");

        cy.apiLogin(data.email, "password");
        cy.visit(`/applications/${data.lastName}`);
    });

    it("Verify error message in case of restricted access", () => {
        data.appName = `${fake.companyName} App`;
        cy.apiCreateApp(data.appName);
        cy.openApp();
        releaseApp();

        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
        cy.wait(1000);
        cy.logoutApi();

        cy.apiLogin(data.email, "password");
        cy.visit(`/applications/${data.slug}`);

        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "Restricted access"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "You don’t have access to this app. Kindly contact admin to know more."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.url().should("eq", "http://localhost:8082/error/restricted");

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

        cy.visit(`http://localhost:8082/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "URL unavailable"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "This URL is not accessible because it has not been released yet. Please either release it or contact admin for access."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.url().should("eq", "http://localhost:8082/error/url-unavailable");
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");

        cy.logoutApi();
        cy.apiLogin(data.email, "password");
        cy.wait(500);

        cy.visit(`http://localhost:8082/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "Restricted access"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "You don’t have access to this app. Kindly contact admin to know more."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.url().should("eq", "http://localhost:8082/error/restricted");
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");
        logout();

        cy.defaultWorkspaceLogin();
        navigateToManageGroups();
        cy.wait(1000);
        cy.get(groupsSelector.appSearchBox).click();
        cy.wait(500);
        cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
        cy.get(groupsSelector.selectAddButton).click();
        cy.get("table").contains("td", data.appName);
        cy.contains("td", data.appName)
            .parent()
            .within(() => {
                cy.get("td input").eq(1).check();
            });

        cy.logoutApi();
        cy.apiLogin(data.email, "password");
        cy.wait(500);

        cy.visit(`http://localhost:8082/applications/${data.slug}`);
        cy.get(commonSelectors.modalHeader).verifyVisibleElement(
            "have.text",
            "URL unavailable"
        );
        cy.get(commonSelectors.modalDescription).verifyVisibleElement(
            "have.text",
            "This URL is not accessible because it has not been released yet. Please either release it or contact admin for access."
        );
        cy.get(commonSelectors.backToHomeButton).verifyVisibleElement(
            "have.text",
            "Back to home page"
        );
        cy.url().should("eq", "http://localhost:8082/error/url-unavailable");
        cy.get(commonSelectors.backToHomeButton).click();
        cy.get(commonSelectors.pageSectionHeader).should("be.visible");
    });
});
