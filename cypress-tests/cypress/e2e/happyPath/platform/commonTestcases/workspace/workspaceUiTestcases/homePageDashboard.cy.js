import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { commonText } from "Texts/common";
import { cleanAllUsers } from "Support/utils/manageUsers";
import { dashboardText } from "Texts/dashboard";

describe("Home Page Dashboard Testcases", () => {
    let data = {};
    const isEnterprise = Cypress.env("environment") === "Enterprise";

    before(function () {
        if (Cypress.env("environment") === "Community") {
            this.skip();
        }
    });
    beforeEach(() => {

        data = {
            firstName: fake.firstName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        };
        cy.intercept("GET", "/api/library_apps").as("appLibrary");
        cy.apiLogin();
        cleanAllUsers()
        cy.visit("/my-workspace");

    });

    it("Should verify elements on home page dashboard", () => {

        cy.get(commonSelectors.homePageIcon, { timeout: 20000 }).click();
        cy.get(commonSelectors.breadcrumbHeaderTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq(
                commonText.breadcrumbHome
            );
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            commonText.breadcrumbHome
        );

        cy.get(dashboardSelector.aiIcon).should("be.visible");
        cy.get(dashboardSelector.homePagePromptHeader).verifyVisibleElement(
            "have.text",
            dashboardText.homePagePromptHeader
        );

        cy.get(dashboardSelector.promptInput).should("be.visible");
        cy.get(dashboardSelector.homePagePromptTextArea).should("be.enabled").type("Build a task manager app");
        cy.get(dashboardSelector.promptEnterButton).should("have.attr", "class").and("include", "tw-opacity-100");


        cy.get(dashboardSelector.homePageDividerText).verifyVisibleElement(
            "have.text",
            dashboardText.homePageDividerText
        );

        // Define card types
        const cardTypes = [
            { type: 'app', title: dashboardText.appCardTitle, description: dashboardText.appCardDescription, url: "my-workspace" },
            { type: 'datasource', title: dashboardText.datasourceCardTitle, description: dashboardText.datasourceCardDescription, url: 'data-sources' },
            { type: 'workflow', title: dashboardText.workflowCardTitle, description: dashboardText.workflowCardDescription, url: 'workflows' },
            { type: 'template', title: dashboardText.templateCardTitle, description: dashboardText.templateCardDescription, url: '#' }
        ];


        const env = Cypress.env('environment');

        // Filter cards based on environment
        const cardsToTest = cardTypes.filter(cardType => {
            if (env === 'Enterprise') return ['app', 'datasource', 'workflow'].includes(cardType.type);
            if (env === 'Cloud') return ['add', 'datasource', 'template'].includes(cardType.type);
            return false;
        });

        cardsToTest.forEach(cardType => {
            cy.get(dashboardSelector.widgetCardName(cardType.type)).within(() => {
                cy.get(dashboardSelector.homePageIcon(cardType.type)).should("be.visible");
                cy.get(dashboardSelector.widgetCardTitle).verifyVisibleElement(
                    "have.text",
                    cardType.title
                );
                cy.get(dashboardSelector.widgetCardDescription).verifyVisibleElement(
                    "have.text",
                    cardType.description
                );

            });
            cy.get(dashboardSelector.widgetCardName(cardType.type)).should("have.attr", "href").and("include", cardType.url);
        });

    });

    it("Should verify Home page accessibility for the specific role", () => {
        cy.intercept("GET", "/api/license/access").as("getLicenseAccess");
        //Invite End-user
        cy.apiFullUserOnboarding(data.firstName, data.email);
        cy.apiLogout();

        cy.apiLogin(data.email);
        cy.visit("/my-workspace");
        cy.wait("@getLicenseAccess");

        cy.get(commonSelectors.homePageIcon).should("not.exist");
        cy.apiLogout();

        cy.apiLogin();
        cy.visit("/my-workspace");
        cy.wait("@getLicenseAccess");

        //Update role to Builder
        cy.apiUpdateUserRole(data.email, "builder");
        cy.apiLogout();

        cy.apiLogin(data.email);
        cy.visit("/my-workspace");
        cy.wait("@getLicenseAccess");

        cy.get(commonSelectors.homePageIcon, { timeout: 20000 }).should("be.visible");
    });
});
