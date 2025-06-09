import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import {
    inviteUser,
    WorkspaceInvitationLink,
} from "Support/utils/platform/eeCommon.js";
import { commonSelectors } from "Selectors/common";
import {
    commonEeSelectors,
    ssoEeSelector,
    instanceSettingsSelector,
} from "Selectors/eeCommon";
import { commonEeText } from "Texts/eeCommon";
import {
    setSignupStatus,
    defaultSSO,
    deleteOrganisationSSO,
} from "Support/utils/manageSSO";
import { confirmInviteElements } from "Support/utils/manageUsers";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";

import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";
import { enableInstanceSignup } from "Support/utils/manageSSO";

describe("Verify OIDC user onboarding", () => {
    const envVar = Cypress.env("environment");

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.intercept("GET", "api/library_apps").as("apps");
        cy.wait(2000);
        defaultSSO(true);
    });

    it("Verify user onboarding using workspace OIDC", () => {
        deleteOrganisationSSO("My workspace", ["openid"]);
        common.navigateToManageSSO();
        defaultSSO(false);
        setSignupStatus(false);
        cy.wait(1000);

        cy.get(ssoEeSelector.oidc).click();
        cy.get(ssoEeSelector.oidcToggle).click();
        cy.clearAndType(ssoEeSelector.nameInput, "Tooljet OIDC");
        cy.clearAndType(
            ssoEeSelector.clientIdInput,
            Cypress.env("SSO_OPENID_CLIENT_ID")
        );
        cy.clearAndType(
            ssoEeSelector.clientSecretInput,
            Cypress.env("SSO_OPENID_CLIENT_SECRET")
        );
        cy.clearAndType(
            ssoEeSelector.WellKnownUrlInput,
            Cypress.env("SSO_OPENID_WELL_KNOWN_URL")
        );
        cy.get(commonEeSelectors.saveButton).eq(1).click();
        cy.get('[data-cy="enable-button"]').click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            ssoText.toggleUpdateToast("OpenID")
        );

        cy.apiLogout();
        cy.visit("/login/my-workspace");
        cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
            "have.text",
            "Sign in with Tooljet OIDC"
        );
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".superadmin-button").click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Open ID login failed - User does not exist in the workspace"
        );

        cy.apiLogin();
        setSignupStatus(true);
        cy.apiLogout();

        cy.visit("/login/my-workspace");
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".superadmin-button").click();

        common.logout();

        cy.defaultWorkspaceLogin();
        common.navigateToManageUsers();
        common.searchUser("superadmin@tooljet.com");

        cy.contains("td", "superadmin@tooljet.com")
            .parent()
            .within(() => {
                cy.get("td small").should("have.text", usersText.activeStatus);
            });

        cy.apiLogout();
        cy.visit("/my-workspace");
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".superadmin-button").click();
    });

    it("Verify invited user onboarding using instance level OIDC", () => {
        setSignupStatus(true);

        cy.ifEnv("Enterprise", () => {
            enableInstanceSignup();
        });

        common.navigateToManageUsers();
        inviteUser("user", "user@tooljet.com");
        confirmInviteElements("user@tooljet.com");
        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".user-button").click();
        cy.wait(1000);

        cy.get(commonSelectors.acceptInviteButton).click();
        cy.wait("@apps");
        cy.contains("My workspace").should("be.visible");
        common.logout();

        cy.defaultWorkspaceLogin();
        setSignupStatus(false);

        common.navigateToManageUsers();
        cy.wait(500);
        inviteUser("user", "userthree@tooljet.com");
        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".user-four-button").click();

        cy.get(commonSelectors.toastMessage)
            .should("be.visible")
            .and(
                "have.text",
                "Open ID login failed - Invalid Email: Please use the email address provided in the invitation."
            );
        cy.wait(500);
        cy.defaultWorkspaceLogin();

        setSignupStatus(true);
        fetchAndVisitInviteLink("userthree@tooljet.com");
        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".user-four-button").click();
        cy.get(commonSelectors.toastMessage)
            .should("be.visible")
            .and(
                "have.text",
                "Open ID login failed - Invalid Email: Please use the email address provided in the invitation."
            );
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".superadmin-button").click();
        cy.get(commonSelectors.toastMessage)
            .should("be.visible")
            .and(
                "have.text",
                "Open ID login failed - Invalid Email: Please use the email address provided in the invitation."
            );
    });

    if (envVar === "Enterprise") {
        it("Verify user onboarding using instance level OIDC", () => {
            enableInstanceSignup();
            cy.apiLogout();

            cy.visit("/");
            cy.get(ssoEeSelector.oidcSSOText).realClick();
            cy.get(".admin-button").click();
            cy.wait(3000);
            common.logout();

            cy.defaultWorkspaceLogin();
            cy.get(commonSelectors.settingsIcon).click();
            cy.get(commonEeSelectors.instanceSettingIcon).click();
            cy.clearAndType(commonSelectors.inputUserSearch, "admin@tooljet.com");

            cy.get(instanceSettingsSelector.userStatus("admin")).verifyVisibleElement(
                "have.text",
                usersText.activeStatus
            );

            cy.apiLogout();
            cy.visit("/");
            cy.get(ssoEeSelector.oidcSSOText).realClick();
            cy.get(".admin-button").click();
        });
    }


    it("Verify archived user login using OIDC", () => {
        setSignupStatus(true);
        cy.ifEnv("Enterprise", () => {
            enableInstanceSignup();
        });
        common.navigateToManageUsers();
        cy.get(usersSelector.buttonAddUsers).click();
        cy.get(commonSelectors.inputFieldFullName).type("user two");
        cy.get(commonSelectors.inputFieldEmailAddress).type("usertwo@tooljet.com");
        cy.get(usersSelector.buttonInviteUsers).click();
        WorkspaceInvitationLink("usertwo@tooljet.com");

        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".user-two-button").click();

        cy.get(commonSelectors.acceptInviteButton).click();
        cy.wait("@apps");
        cy.contains("My workspace").should("be.visible");
        common.logout();

        cy.defaultWorkspaceLogin();
        common.navigateToManageUsers();
        common.searchUser("usertwo@tooljet.com");
        cy.get('[data-cy="user-actions-button"]').click();
        cy.get('[data-cy="archive-button"]').click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            usersText.archivedToast
        );
        cy.get(instanceSettingsSelector.userStatus("user two"), {
            timeout: 9000,
        }).should("have.text", usersText.archivedStatus);
        cy.apiLogout();
        cy.visit("/my-workspace");
        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).realClick();
        cy.get(".user-two-button").click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Open ID login failed - User is archived in the workspace"
        );
    });
});
