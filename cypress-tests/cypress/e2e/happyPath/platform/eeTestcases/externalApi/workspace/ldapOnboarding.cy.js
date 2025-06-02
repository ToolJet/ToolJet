import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";
import {
    setSSOStatus,
    setSignupStatus,
} from "Support/utils/manageSSO";
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
import {
    enableToggle,
    disableToggle,
    VerifyWorkspaceInvitePageElements,
} from "Support/utils/platform/eeCommon";

import { addAppToGroup, addUserToGroup } from "Support/utils/manageGroups";

describe("LDAP flow", () => {
    const data = {};
    data.appName = `${fake.companyName} App`;

    beforeEach(() => {
        cy.visit('/');
        cy.appUILogin();
    });

    it.only("Verify the LDAP UI and user onboarding", () => {
        setSSOStatus("My workspace", "ldap", false);
        navigateToManageSSO();
        cy.wait(1000);
        cy.get('[data-cy="ldap-sso-card"]')
            .verifyVisibleElement("have.text", "LDAP")
            .click();
        cy.get(ssoEeSelector.ldapToggle).should("be.visible");

        for (const elements in ssoEeSelector.ldapPageElements) {
            cy.get(ssoEeSelector.ldapPageElements[elements]).verifyVisibleElement(
                "have.text",
                ssoEeText.ldapPageElements[elements]
            );
        }
        cy.get(ssoEeSelector.statusLabel).should("be.visible");
        cy.get(ssoEeSelector.nameInput).should("be.visible");
        cy.get(ssoEeSelector.hostInput).should("be.visible");
        cy.get(ssoEeSelector.portInput).should("be.visible");
        cy.get(ssoEeSelector.baseDnInput).should("be.visible");
        cy.get(ssoEeSelector.sslToggleInput).should("be.visible");
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

        cy.clearAndType(ssoEeSelector.nameInput, "Tooljet LDAP Auth");
        cy.clearAndType(ssoEeSelector.hostInput, Cypress.env("ldap_host"));
        cy.clearAndType(ssoEeSelector.portInput, "10389");
        cy.clearAndType(ssoEeSelector.baseDnInput, Cypress.env("ldap_base_dn"));
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
        cy.get(ssoEeSelector.ldapSSOText).verifyVisibleElement(
            "have.text",
            ssoEeText.ldapSSOText
        );
        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.get('[data-cy="key-logo"]').should("be.visible");
        cy.get(commonSelectors.inputFieldName).verifyVisibleElement(
            "have.text",
            ssoEeText.userNameInputLabel
        );
        cy.get(commonSelectors.inputFieldName).should("be.visible");
        cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
            "have.text",
            "Password"
        );
        cy.get(commonSelectors.passwordInputField).should("be.visible");
        cy.get(commonSelectors.signUpButton).verifyVisibleElement(
            "have.text",
            "Sign in"
        );

        cy.clearAndType(commonSelectors.inputFieldName, "Hubert J. Farnsworth");
        cy.clearAndType(commonSelectors.passwordInputField, "professor");
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "LDAP login failed - User does not exist in the workspace"
        );

        cy.defaultWorkspaceLogin();
        setSignupStatus(true);
        logout();

        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, "Hubert J. Farnsworth");
        cy.clearAndType(commonSelectors.passwordInputField, "professor");
        cy.get(commonSelectors.signUpButton).click();

        // VerifyWorkspaceInvitePageElements();
        // cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
        //     "have.text",
        //     "Professor Farnsworth"
        // );
        // cy.get(commonSelectors.invitedUserEmail).verifyVisibleElement(
        //     "have.text",
        //     "professor@planetexpress.com"
        // );

        // cy.get(commonSelectors.acceptInviteButton).click();
    });

    it("Verify the LDAP SSO user info on inspector", () => {
        cy.intercept("GET", "api/library_apps").as("apps");
        cy.skipWalkthrough();

        cy.createApp(data.appName);
        cy.dragAndDropWidget("Table", 250, 250);
        cy.backToApps();
        navigateToManageGroups();
        addAppToGroup(data.appName);
        cy.get(commonSelectors.dashboardIcon).click();
        cy.wait("@apps");
        logout();

        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, "Hubert J. Farnsworth");
        cy.clearAndType(commonSelectors.passwordInputField, "professor");
        cy.get(commonSelectors.signUpButton).click();

        cy.wait("@apps");
        cy.wait(1000);
        navigateToAppEditor(data.appName);
        pinInspector();
        cy.get('[data-cy="inspector-node-globals"] > .node-key').click();
        cy.get('[data-cy="inspector-node-currentuser"] > .node-key').click();
        cy.get('[data-cy="inspector-node-ssouserinfo"] > .node-key').click();
        cy.get('[data-cy="inspector-node-mail"] > .node-key').click();
        cy.get('[data-cy="inspector-node-0"] > .mx-2').verifyVisibleElement(
            "have.text",
            `"professor@planetexpress.com"`
        );
    });

    it("Verify archive and unarchive functionality", () => {
        navigateToManageUsers();
        searchUser("professor@planetexpress.com");
        cy.get('[data-cy="user-actions-button"]').click();
        cy.get('[data-cy="archive-button"]').click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            usersText.archivedToast
        );

        cy.contains("td", "professor@planetexpress.com")
            .parent()
            .within(() => {
                cy.get("td small").should("have.text", usersText.archivedStatus);
            });

        logout();

        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, "Hubert J. Farnsworth");
        cy.clearAndType(commonSelectors.passwordInputField, "professor");
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "LDAP login failed - User does not exist in the workspace"
        );

        cy.appUILogin();
        navigateToManageUsers();
        searchUser("professor@planetexpress.com");
        cy.get('[data-cy="user-actions-button"]').click();
        cy.get('[data-cy="archive-button"]').click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            usersText.unarchivedToast
        );
        logout();

        cy.get(ssoEeSelector.ldapSSOText).click();
        cy.clearAndType(commonSelectors.inputFieldName, "Hubert J. Farnsworth");
        cy.clearAndType(commonSelectors.passwordInputField, "professor");
        cy.get(commonSelectors.signUpButton).click();
    });
});
