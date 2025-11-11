import { commonSelectors } from "Selectors/common";
import { toggleSsoViaUI, updateSsoId, gitHubSignInWithAssertion, cleanupTestUser } from "Support/utils/manageSSO";
import { fillInputField } from "Support/utils/common";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

describe('GitHub SSO Tests', () => {
    const TEST_USER_EMAIL = 'qatooljet@gmail.com';
    const TEST_USER_NAME = 'The QA';
    const WORKSPACE_URL = '/my-workspace';
    const WORKSPACE_SETTINGS_URL = '/my-workspace/workspace-settings/workspace-login';
    const GIT_SSO_BUTTON_SELECTOR = '[data-cy="git-sso-button"]';

    const emptyGitConfig = {
        "type": "git",
        "configs": {
            "clientId": "",
            "clientSecret": "",
            "hostName": ""
        },
        "enabled": false
    };

    const instanceGitHubConfig = Cypress.env("instanceGitHubConfig");
    const workspaceGitHubConfig = Cypress.env("workspaceGitHubConfig");

    const ERROR_MESSAGES = {
        USER_NOT_EXIST_SIGNUP: "GitHub login failed - User does not exist, please sign up",
        USER_NOT_IN_WORKSPACE: "GitHub login failed - User does not exist in the workspace"
    };

    const TEST_SSO_ID = 'dbe8cc6f-8300-403a-9691-3ba304f2a744';
    beforeEach(() => {
        cy.apiLogin();
        cy.getAuthHeaders().as('adminHeaders').then((adminHeaders) => {

            cy.apiUpdateSSOConfig(emptyGitConfig, 'instance', adminHeaders);
            cy.apiUpdateAllowSignUp(false, 'organization', adminHeaders);
            cy.apiUpdateAllowSignUp(false, 'instance', adminHeaders);
            cy.apiUpdateSSOConfig(emptyGitConfig, 'workspace', adminHeaders);
            cleanupTestUser(TEST_USER_EMAIL)
        });
    });



    it('should verify sso without configuration on instance', () => {

        toggleSsoViaUI('GitHub')
        cy.apiLogout();
        cy.visit('/');
        cy.get(GIT_SSO_BUTTON_SELECTOR).click();
        gitHubSignInWithAssertion({ type: 'failure' });
    });

    it('should verify sso without configuration on workspace', () => {

        toggleSsoViaUI('GitHub', WORKSPACE_SETTINGS_URL)
        cy.apiLogout();

        cy.visit(WORKSPACE_URL);
        cy.get(GIT_SSO_BUTTON_SELECTOR).click();
        gitHubSignInWithAssertion({ type: 'failure' });
    });

    it('should verify signup via sso to instance', () => {

        toggleSsoViaUI('GitHub');
        fillInputField(instanceGitHubConfig);
        cy.get(commonSelectors.saveButton).eq(1).click();

        cy.wait(1000);
        cy.apiLogout();
        cy.visit('/');
        cy.get(GIT_SSO_BUTTON_SELECTOR).click();

        gitHubSignInWithAssertion();
        cy.verifyToastMessage(commonSelectors.toastMessage, ERROR_MESSAGES.USER_NOT_EXIST_SIGNUP);

        cy.apiLogin();
        cy.getAuthHeaders().then((freshAdminHeaders) => {
            cy.apiUpdateAllowSignUp(true, 'instance', freshAdminHeaders);
            cy.apiLogout();

            cy.visit('/');
            cy.get(GIT_SSO_BUTTON_SELECTOR).click();
            cy.get(commonSelectors.breadcrumbPageTitle).should('have.text', 'All apps');

        });
    });

    it('should verify signup via sso to workspace', () => {
        const orgId = Cypress.env("workspaceId");

        updateSsoId(TEST_SSO_ID, 'git', `'${orgId}'`);

        toggleSsoViaUI('GitHub', WORKSPACE_SETTINGS_URL);
        fillInputField(workspaceGitHubConfig);
        cy.get(commonSelectors.saveButton).eq(1).click();

        cy.wait(1000);
        cy.apiLogout();
        cy.visit(WORKSPACE_URL);
        cy.get(GIT_SSO_BUTTON_SELECTOR).click();

        gitHubSignInWithAssertion();
        cy.verifyToastMessage(commonSelectors.toastMessage, ERROR_MESSAGES.USER_NOT_IN_WORKSPACE);

        cy.apiLogin();
        cy.getAuthHeaders().then((freshAdminHeaders) => {
            cy.apiUpdateAllowSignUp(true, 'organization', freshAdminHeaders);
            cy.apiLogout();

            cy.visit(WORKSPACE_URL);
            cy.get(GIT_SSO_BUTTON_SELECTOR).click();
            cy.get(commonSelectors.breadcrumbPageTitle).should('have.text', 'All apps');

        });
    });
    it('should verify invite and login via sso to workspace', () => {
        cy.apiUserInvite(TEST_USER_NAME, TEST_USER_EMAIL);


        toggleSsoViaUI('GitHub', WORKSPACE_SETTINGS_URL);
        fillInputField(workspaceGitHubConfig);
        cy.get(commonSelectors.saveButton).eq(1).click();

        fetchAndVisitInviteLink(TEST_USER_EMAIL);
        cy.get(GIT_SSO_BUTTON_SELECTOR).click();
        gitHubSignInWithAssertion();

        cy.get(commonSelectors.acceptInviteButton).click()
        cy.get(commonSelectors.breadcrumbPageTitle).should('have.text', 'All apps');

    });

});
