import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import { inviteUserToWorkspace } from "Support/utils/manageUsers";
import { logout } from "Support/utils/common";
import { setupAndUpdateRole } from "Support/utils/manageGroups";

describe("Home Page Dashboard Testcases", () => {
    let data = {};
    beforeEach(() => {

        data = {
            workspaceName: fake.firstName,
            workspaceSlug: fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", ""),
            firstName: fake.firstName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        };
        cy.intercept("GET", "/api/library_apps").as("appLibrary");
        cy.skipWalkthrough();

        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.apiLogout();
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

    });

    it("Should verify elements on home page dashboard", () => {
        cy.get(commonSelectors.homePageIcon).click();
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
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
            { type: 'app', title: dashboardText.appCardTitle, description: dashboardText.appCardDescription, url: `${data.workspaceSlug}` },
            { type: 'datasource', title: dashboardText.datasourceCardTitle, description: dashboardText.datasourceCardDescription, url: 'data-sources' },
            { type: 'workflow', title: dashboardText.workflowCardTitle, description: dashboardText.workflowCardDescription, url: 'workflows' },
            { type: 'template', title: dashboardText.templateCardTitle, description: dashboardText.templateCardDescription, url: '#' }
        ];


        const env = Cypress.env('environment');

        // Filter cards based on environment
        const cardsToTest = cardTypes.filter(cardType => {
            if (env === 'Enterprise') return ['app', 'datasource', 'workflow'].includes(cardType.type);
            if (env === 'cloud') return ['add', 'datasource', 'template'].includes(cardType.type);
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
        //Invite End-user
        inviteUserToWorkspace(data.firstName, data.email);
        cy.get(commonSelectors.homePageIcon).should("not.exist");
        logout();
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        //Update role to Builder
        setupAndUpdateRole("end-user", "builder", data.email);
        logout();
        cy.appUILogin(data.email);
        cy.get(commonSelectors.homePageIcon).should("be.visible");
    });
});
