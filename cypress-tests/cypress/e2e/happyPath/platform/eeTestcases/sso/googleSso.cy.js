import { commonSelectors } from "Selectors/common";
import { toggleSsoViaUI, updateSsoId, cleanupTestUser } from "Support/utils/manageSSO";
import { fillInputField } from "Support/utils/common";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

describe('Google SSO Tests', () => {
    const TEST_USER_EMAIL = 'qatooljet@gmail.com';
    const TEST_USER_NAME = 'The QA';
    const WORKSPACE_URL = '/my-workspace';
    const WORKSPACE_SETTINGS_URL = '/my-workspace/workspace-settings/workspace-login';
    const GOOGLE_SSO_BUTTON_SELECTOR = '[data-cy="google-sso-button"]';

    const emptyGoogleConfig = {
        "type": "google",
        "configs": {
            "clientId": "",
        },
        "enabled": false
    };

    const googleSsoConfig = Cypress.env("googleSsoConfig");

    const ERROR_MESSAGES = {
        USER_NOT_EXIST_SIGNUP: "Google login failed - User does not exist, please sign up",
        USER_NOT_IN_WORKSPACE: "Google login failed - User does not exist in the workspace"
    };

    const TEST_SSO_ID = '688f4b68-8c3b-41b2-aecb-1c1e9a112de1';
    beforeEach(() => {
        cy.apiLogin();
        cy.getAuthHeaders().as('adminHeaders').then((adminHeaders) => {
            cy.apiUpdateSSOConfig(emptyGoogleConfig, 'instance', adminHeaders);
            cy.apiUpdateAllowSignUp(false, 'organization', adminHeaders);
            cy.apiUpdateAllowSignUp(false, 'instance', adminHeaders);
            cy.apiUpdateSSOConfig(emptyGoogleConfig, 'workspace', adminHeaders);
            cleanupTestUser(TEST_USER_EMAIL);
        });
    });

    it('should verify sso without configuration on instance', () => {

        toggleSsoViaUI('Google')
        cy.apiLogout();
        cy.visit('/');
        cy.get(GOOGLE_SSO_BUTTON_SELECTOR).click();
        cy.origin('https://accounts.google.com', () => {
            cy.contains('Authorization Error').should('be.visible');
        });

    });

    it('should verify sso without configuration on workspace', () => {

        toggleSsoViaUI('Google', WORKSPACE_SETTINGS_URL)
        cy.apiLogout();

        cy.visit(WORKSPACE_URL);
        cy.get(GOOGLE_SSO_BUTTON_SELECTOR).click();
        cy.origin('https://accounts.google.com', () => {
            cy.contains('Authorization Error').should('be.visible');
        });
    });


    it('should verify signup via sso to instance', () => {

        toggleSsoViaUI('Google');
        fillInputField(googleSsoConfig);
        cy.get(commonSelectors.saveButton).eq(1).click();

        cy.wait(1000);
        cy.apiLogout();
        cy.visit('/');
        cy.get(GOOGLE_SSO_BUTTON_SELECTOR).click();

        cy.apiLoginByGoogle('');
        cy.verifyToastMessage(commonSelectors.toastMessage, ERROR_MESSAGES.USER_NOT_EXIST_SIGNUP);

        cy.apiLogin();
        cy.getAuthHeaders().then((freshAdminHeaders) => {
            cy.apiUpdateAllowSignUp(true, 'instance', freshAdminHeaders);
            cy.apiLogout();

            cy.apiLoginByGoogle('');

            cy.get(commonSelectors.breadcrumbPageTitle).should('have.text', 'All apps');

        });
    });

    it('should verify signup via sso to workspace', () => {
        const orgId = Cypress.env("workspaceId");
        updateSsoId(TEST_SSO_ID, 'google', `${orgId}`);

        toggleSsoViaUI('Google', WORKSPACE_SETTINGS_URL);
        fillInputField(googleSsoConfig);
        cy.get(commonSelectors.saveButton).eq(1).click();

        cy.wait(1000);
        cy.apiLogout();
        cy.visit(WORKSPACE_URL);
        cy.get(GOOGLE_SSO_BUTTON_SELECTOR).click();

        cy.apiLoginByGoogle();
        cy.verifyToastMessage(commonSelectors.toastMessage, ERROR_MESSAGES.USER_NOT_IN_WORKSPACE);

        cy.apiLogin();
        cy.getAuthHeaders().then((freshAdminHeaders) => {
            cy.apiUpdateAllowSignUp(true, 'organization', freshAdminHeaders);
            cy.apiLogout();

            cy.visit(WORKSPACE_URL);
            cy.apiLoginByGoogle();
            cy.get(commonSelectors.breadcrumbPageTitle).should('have.text', 'All apps');

        });
    });
    it('should verify invite and login via sso to workspace', () => {
        toggleSsoViaUI('Google', WORKSPACE_SETTINGS_URL);
        fillInputField(googleSsoConfig);
        cy.get(commonSelectors.saveButton).eq(1).click();

        cy.apiUserInvite(TEST_USER_NAME, TEST_USER_EMAIL);
        fetchAndVisitInviteLink(TEST_USER_EMAIL);

        cy.apiLoginByGoogle()
        cy.get(commonSelectors.acceptInviteButton).click()
        cy.get(commonSelectors.breadcrumbPageTitle).should('have.text', 'All apps');

    });
});