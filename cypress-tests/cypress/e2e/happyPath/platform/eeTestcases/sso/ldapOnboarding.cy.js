import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { ssoEeText } from "Texts/eeCommon";
import { setSSOStatus, setSignupStatus } from "Support/utils/manageSSO";
import { usersText } from "Texts/manageUsers";
import { fake } from "Fixtures/fake";
import {
    logout,
    navigateToManageSSO,
    navigateToManageUsers,
    searchUser,
    pinInspector,
    navigateToAppEditor,
    navigateToManageGroups,
} from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import { enableToggle, disableToggle } from "Support/utils/platform/eeCommon";
import { setupAndUpdateRole } from "Support/utils/manageGroups";

describe("LDAP flow", () => {
    const TEST_DATA = {
        appName: `${fake.companyName} App`,
        ldapUser: {
            username: "Hubert J. Farnsworth",
            password: "professor",
            email: "professor@planetexpress.com",
        },
        ldapConfig: {
            name: "Tooljet LDAP Auth",
            host: Cypress.env("ldap_host"),
            port: "10389",
            baseDn: Cypress.env("ldap_base_dn"),
        },
    };

    const ldapLogin = (
        username = TEST_DATA.ldapUser.username,
        password = TEST_DATA.ldapUser.password
    ) => {
        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, username);
        cy.clearAndType(ssoEeSelector.passwordInputField, password);
        cy.get(commonSelectors.signUpButton).click();
    };

    const toggleUserArchiveStatus = (shouldArchive = true) => {
        navigateToManageUsers();
        searchUser(TEST_DATA.ldapUser.email);
        cy.get('[data-cy="user-actions-button"]').click();
        cy.get('[data-cy="archive-button"]').click();

        const expectedToast = shouldArchive
            ? usersText.archivedToast
            : usersText.unarchivedToast;
        cy.verifyToastMessage(commonSelectors.toastMessage, expectedToast);

        if (shouldArchive) {
            cy.contains("td", TEST_DATA.ldapUser.email)
                .parent()
                .within(() => {
                    cy.get("td small").should("have.text", usersText.archivedStatus);
                });
        }
    };

    beforeEach(() => {
        cy.visit("/");
        cy.appUILogin();
    });

    it("Verify complete LDAP flow: UI, user onboarding, inspector SSO info, and archive functionality", () => {
        cy.intercept("GET", "api/library_apps").as("apps");

        // ========== SECTION 1: LDAP Configuration and UI Verification ==========
        setSSOStatus("My workspace", "ldap", false);
        navigateToManageSSO();
        cy.wait(1000);

        cy.get('[data-cy="ldap-sso-card"]')
            .verifyVisibleElement("have.text", "LDAP")
            .click();

        cy.get(ssoEeSelector.ldapToggle).should("be.visible");

        for (const element in ssoEeSelector.ldapPageElements) {
            cy.get(ssoEeSelector.ldapPageElements[element]).verifyVisibleElement(
                "have.text",
                ssoEeText.ldapPageElements[element]
            );
        }

        const formElements = [
            ssoEeSelector.statusLabel,
            ssoEeSelector.nameInput,
            ssoEeSelector.hostInput,
            ssoEeSelector.portInput,
            ssoEeSelector.baseDnInput,
            ssoEeSelector.sslToggleInput,
        ];

        formElements.forEach((selector) => {
            cy.get(selector).should("be.visible");
        });

        cy.get(commonSelectors.cancelButton)
            .eq(1)
            .verifyVisibleElement("have.text", "Cancel");
        cy.get(commonEeSelectors.saveButton)
            .eq(1)
            .verifyVisibleElement("have.text", "Save changes");

        enableToggle(ssoEeSelector.sslToggleInput);
        cy.get(ssoEeSelector.ldapPageElements.sslLabel)
            .eq(1)
            .verifyVisibleElement("have.text", "SSL certificate");
        cy.get(".css-1x65k0v-control").should("be.visible");

        cy.clearAndType(ssoEeSelector.nameInput, TEST_DATA.ldapConfig.name);
        cy.clearAndType(ssoEeSelector.hostInput, TEST_DATA.ldapConfig.host);
        cy.clearAndType(ssoEeSelector.portInput, TEST_DATA.ldapConfig.port);
        cy.clearAndType(ssoEeSelector.baseDnInput, TEST_DATA.ldapConfig.baseDn);

        cy.get(ssoEeSelector.sslToggleInput).uncheck();
        cy.get(ssoEeSelector.ldapToggle).click();
        disableToggle(ssoEeSelector.sslToggleInput);

        cy.get(commonEeSelectors.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            ssoText.toggleUpdateToast("LDAP")
        );
        cy.get(commonSelectors.cancelButton).eq(1).click();
        logout();

        // ========== SECTION 2: LDAP Login Page and User Onboarding ==========
        cy.get(ssoEeSelector.ldapSSOText).verifyVisibleElement(
            "have.text",
            ssoEeText.ldapSSOText
        );

        cy.get(ssoEeSelector.ldapSSOText).click();

        const loginPageElements = [
            { selector: '[data-cy="key-logo"]', assertion: "be.visible" },
            {
                selector: ssoEeSelector.userNameInputLabel,
                text: ssoEeText.userNameInputLabel,
            },
            { selector: commonSelectors.inputFieldName, assertion: "be.visible" },
            { selector: ssoEeSelector.passwordInputLabel, text: "Password" },
            { selector: ssoEeSelector.passwordInputField, assertion: "be.visible" },
            { selector: commonSelectors.signUpButton, text: "Sign in" },
        ];

        loginPageElements.forEach((element) => {
            if (element.text) {
                cy.get(element.selector).verifyVisibleElement(
                    "have.text",
                    element.text
                );
            } else {
                cy.get(element.selector).should(element.assertion);
            }
        });

        // Test failed login (user doesn't exist in workspace)
        cy.clearAndType(
            commonSelectors.inputFieldName,
            TEST_DATA.ldapUser.username
        );
        cy.clearAndType(
            ssoEeSelector.passwordInputField,
            TEST_DATA.ldapUser.password
        );
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "LDAP login failed - User does not exist in the workspace"
        );

        cy.defaultWorkspaceLogin();
        setSignupStatus(true);
        logout();

        ldapLogin();
        cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
            "have.text",
            "Applications"
        );
        logout();

        // ========== SECTION 3: Setup App and User Permissions for Inspector Test ==========
        cy.defaultWorkspaceLogin();
        cy.apiCreateApp(TEST_DATA.appName);

        navigateToManageGroups();
        setupAndUpdateRole("End-user", "Builder", TEST_DATA.ldapUser.email);
        logout();

        // ========== SECTION 4: Verify SSO User Info in Inspector ==========
        ldapLogin();

        cy.wait("@apps");
        cy.wait(1000);

        navigateToAppEditor(TEST_DATA.appName);
        pinInspector();

        const inspectorPath = [
            '[data-cy="inspector-node-globals"] > .node-key',
            '[data-cy="inspector-node-currentuser"] > .node-key',
            '[data-cy="inspector-node-ssouserinfo"] > .node-key',
            '[data-cy="inspector-node-mail"] > .node-key',
        ];

        inspectorPath.forEach((selector) => cy.get(selector).click());

        cy.get('[data-cy="inspector-node-0"] > .mx-2').verifyVisibleElement(
            "have.text",
            `"${TEST_DATA.ldapUser.email}"`
        );
        cy.backToApps();
        logout();

        // ========== SECTION 5: Archive/Unarchive Functionality ==========
        cy.defaultWorkspaceLogin();

        // Archive user and verify status
        toggleUserArchiveStatus(true);
        logout();

        ldapLogin();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "LDAP login failed - User is archived in the workspace"
        );

        // Unarchive user
        cy.go("back");
        cy.appUILogin();
        toggleUserArchiveStatus(false);
        logout();

        ldapLogin();
        cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
            "have.text",
            "Applications"
        );
    });
});
