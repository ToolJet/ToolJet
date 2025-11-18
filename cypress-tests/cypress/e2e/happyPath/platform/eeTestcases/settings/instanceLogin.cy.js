import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { allowPersonalWorkspace, updateInstanceSettings, passwordToggle } from "Support/utils/platform/eeCommon";
import { dashboardSelector } from "Selectors/dashboard";
import { logout } from "Support/utils/common";


describe('Instance Login', () => {
    let data = {};
    beforeEach(() => {
        data = {
            firstName: fake.firstName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
            workspaceName: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            workspaceSlug: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
        };
        cy.intercept('GET', '/api/library_apps').as('appLibrary');
        cy.apiLogin();
        cy.visit('/');


    });
    it('Should verify personal workspace creation functionality', () => {


        // Enable personal workspace
        cy.apiUpdateLicense("valid");
        allowPersonalWorkspace(true);
        cy.apiFullUserOnboarding(data.firstName, data.email, "builder");
        cy.apiLogout();


        cy.apiLogin(data.email);
        cy.visit('/');
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).should('be.visible').click();
        cy.get(commonSelectors.workspaceNameinput).clear().type(data.workspaceName);
        cy.wait(1000);
        cy.get(dashboardSelector.workspaceSlugInputField)
            .clear()
            .type(data.workspaceSlug);
        cy.wait(1000);
        cy.get(dashboardSelector.createWorkspaceButton)
            .should("be.enabled")
            .click();
        cy.visit(`/${data.workspaceSlug}`);
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            data.workspaceName
        );
        cy.url().should("eq", `${Cypress.config("baseUrl")}/${data.workspaceSlug}`);
        cy.apiLogout();


        // Disable personal workspacw
        allowPersonalWorkspace(false);


        cy.apiLogin(data.email);
        cy.visit('/');
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).should('not.exist');
        cy.apiLogout();


        allowPersonalWorkspace(true);


    });


    it('Should verify instance signup and password login configuration', () => {
        //Verify Signup flag
        updateInstanceSettings('ENABLE_SIGNUP', 'true');
        cy.apiLogout();


        cy.visit('/');
        cy.get(commonSelectors.createAnAccountLink).should('be.visible');


        //Disable signup
        updateInstanceSettings('ENABLE_SIGNUP', 'false');
        cy.visit('/');
        cy.get(commonSelectors.createAnAccountLink).should('not.exist');


        //Password login configuration
        cy.apiLogin();
        passwordToggle(false);
        cy.apiLogout();


        cy.visit('/');
        cy.get("form[class='form-input-area']").should('not.exist');


        cy.apiLogin();
        passwordToggle(true);
        cy.apiLogout();


        cy.visit('/');
        cy.get("form[class='form-input-area']").should('be.visible');
    });


    it('Should verify workspace login and custom logout configurations', () => {
        //Workspace login configuration
        updateInstanceSettings('ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'false');
        cy.reload();
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).click();
        cy.get(commonSelectors.manageSSOOption).should('not.exist');


        updateInstanceSettings('ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'true');
        cy.reload();
        cy.get(commonSelectors.manageSSOOption).should('be.visible');


        //Set Custom logout url
        updateInstanceSettings('CUSTOM_LOGOUT_URL', 'https://www.google.com/');
        logout();
        cy.url().should('include', 'https://www.google.com/');


        //Reset custom logout url
        cy.apiLogin();
        cy.visit('/');
        updateInstanceSettings('CUSTOM_LOGOUT_URL', '');
        logout();
        cy.url().should('include', `${Cypress.config("baseUrl")}/login`);


    });

});