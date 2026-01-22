import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { usersSelector } from "Selectors/manageUsers";
import {
    logout,
    navigateToAppEditor,
    navigateToManageGroups,
    navigateToManageSSO,
    navigateToManageUsers,
    pinInspector,
    searchUser,
} from "Support/utils/common";
import { setupAndUpdateRole } from "Support/utils/manageGroups";
import { disableToggle, enableToggle } from "Support/utils/platform/eeCommon";
import { ssoText } from "Texts/common";
import { ssoEeText } from "Texts/eeCommon";
import { usersText } from "Texts/manageUsers";
import { sanitize } from "Support/utils/common";
import { setSignupStatus } from "Support/utils/manageSSO";
import { apiRequest as baseApiRequest } from "Support/utils/externalApi";
import { navigateAndVerifyInspector } from "Support/utils/inspector";

const apiBaseUrl = Cypress.env("API_URL");
const authHeader = {
    Authorization: Cypress.env("AUTH_TOKEN"),
    "Content-Type": "application/json",
};

const sendApiRequest = (method, endpoint, body, headers = authHeader) =>
    baseApiRequest(method, `${apiBaseUrl}${endpoint}`, body, headers);

describe("LDAP SSO", () => {
    let appName;
    let workspaceName;
    let workspaceSlug;
    const ldapUser = {
        username: "Hubert J. Farnsworth",
        password: "professor",
        email: "professor@planetexpress.com",
    };

    const config = {
        type: "ldap",
        configs: {
            name: "Tooljet LDAP Auth",
            host: Cypress.env("ldap_host"),
            port: "10389",
            ssl: false,
            sslCerts: {},
            basedn: Cypress.env("ldap_base_dn"),
        },
        enabled: true,
    };

    beforeEach(() => {
        workspaceName = `${sanitize(fake.companyName)}-ldap`;
        workspaceSlug = workspaceName;
        appName = `${workspaceName} App`;

        cy.apiLogin();
        cy.apiCreateWorkspace(workspaceName, workspaceSlug).then((workspace) => {
            Cypress.env("workspaceId", workspace.body.organization_id);
        });
    });

    it("should verify LDAP configuration, configure SSO, and verify login page", () => {
        // Step 1: Verify LDAP configuration page UI
        cy.visit(`/${workspaceSlug}`);

        navigateToManageSSO();
        cy.waitForElement(ssoEeSelector.ldapCard);

        cy.get(ssoEeSelector.ldapCard).should("be.visible");
        cy.get(ssoEeSelector.ldapLabel).should("have.text", "LDAP");
        cy.get(`${ssoEeSelector.ldapCard} > .switch > .slider`).should("be.visible");
        cy.wait(1000);
        cy.get(ssoEeSelector.ldapCard).click();
        cy.get(ssoEeSelector.ldapToggle).should("be.visible");

        // Verify form fields using forEach
        const formFields = [
            ssoEeSelector.nameInput,
            ssoEeSelector.hostInput,
            ssoEeSelector.portInput,
            ssoEeSelector.baseDnInput,
            ssoEeSelector.sslToggleInput,
        ];

        formFields.forEach((field) => {
            cy.get(field).should("be.visible");
        });

        // Verify buttons using forEach
        const buttons = [
            { selector: commonSelectors.cancelButton, index: 1, text: "Cancel" },
            {
                selector: commonEeSelectors.saveButton,
                index: 1,
                text: "Save changes",
            },
        ];

        buttons.forEach((button) => {
            cy.get(button.selector).eq(button.index).should("have.text", button.text);
        });

        // Verify SSL certificate field appears when enabled
        cy.get(ssoEeSelector.sslToggleInput).click();
        cy.get(ssoEeSelector.ldapPageElements.sslLabel)
            .eq(1)
            .should("have.text", "SSL certificate");

        // Step 2: Configure LDAP SSO successfully

        // Fill configuration
        cy.clearAndType(ssoEeSelector.nameInput, "Tooljet LDAP Auth");
        cy.clearAndType(ssoEeSelector.hostInput, Cypress.env("ldap_host"));
        cy.clearAndType(ssoEeSelector.portInput, "10389");
        cy.clearAndType(ssoEeSelector.baseDnInput, Cypress.env("ldap_base_dn"));

        // Disable SSL and enable LDAP
        cy.get(ssoEeSelector.sslToggleInput).click();
        cy.get(ssoEeSelector.ldapToggle).click();

        cy.get(commonEeSelectors.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Saved LDAP SSO configurations"
        );
        cy.get(commonSelectors.cancelButton).eq(1).click();

        // Step 3: Verify LDAP login page UI
        logout();

        cy.get(ssoEeSelector.ldapSSOText)
            .verifyVisibleElement("have.text", ssoEeText.ldapSSOText)
            .click();
    });

    it("should show error when user does not exist in workspace", () => {

        cy.apiUpdateSSOConfig(config);
        cy.apiCreateApp(appName);

        cy.apiLogout();
        cy.visit(`/${workspaceSlug}`);
        cy.wait(2000);
        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, ldapUser.username);
        cy.clearAndType(ssoEeSelector.passwordInputField, ldapUser.password);
        cy.get(commonSelectors.signUpButton).click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "LDAP login failed - User does not exist in the workspace"
        );

        cy.apiLogin();
        setSignupStatus(true, workspaceName);
        cy.apiLogout();
        cy.visit(`/${workspaceSlug}`);
        cy.wait(2000);

        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, ldapUser.username);
        cy.clearAndType(ssoEeSelector.passwordInputField, ldapUser.password);
        cy.get(commonSelectors.signUpButton).click();

        cy.get(commonSelectors.pageSectionHeader).should(
            "have.text",
            "Applications"
        );

        let userId;
        const workspaceId = Cypress.env("workspaceId");

        sendApiRequest("GET", "/ext/users").then(({ body, status }) => {
            expect(status).to.eq(200);
            expect(body).to.be.an("array");
            const ldapUserData = body.find(user => user.email === ldapUser.email);
            expect(ldapUserData).to.exist;
            userId = ldapUserData.id;

            sendApiRequest("PUT", `/ext/update-user-role/workspace/${workspaceId}`, {
                newRole: "builder",
                userId,
            }).then(({ status }) => {
                expect(status).to.eq(200);
            });
        });

        cy.openApp(appName);
        navigateAndVerifyInspector(["globals", "currentUser"], [
            ["email", `"${ldapUser.email}"`],
            ["firstName", `"Professor"`],
            ["lastName", `"Farnsworth"`],
            ["groups", `[2]`],
            ["role", `"builder"`],
        ]);
    });



    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteAllApps();
    });
});
