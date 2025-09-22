import { fake } from "Fixtures/fake";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { logout } from "Support/utils/common";
import {
    updateSsoId,
    updateOIDCConfig,
    setSignupStatus,
    authResponse,
    OidcConfig,
    enableInstanceSignup,
} from "Support/utils/manageSSO";
import { createGroup, verifyUserRole } from "Support/utils/manageGroups";
import { getUser } from "Support/utils/api";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

const loginWithOIDC = (params, alias = "@userId") => {
    cy.intercept("GET", "/api/authorize").as("openidResponse");
    cy.oidcLogin(params);
    cy.wait("@openidResponse").then((interception) => {
        const userId = interception.response.body.id;
        cy.wrap(userId).as(alias.replace("@", ""));
    });
    cy.wait(4000);
};

describe("Okta OIDC", () => {
    let data;

    data = {
        appName: `${fake.companyName}-IE-App`,
        groupName: `oidc-${fake.companyName}-group`,
    };

    beforeEach("", () => {
        cy.apiLogin();
        enableInstanceSignup();
        setSignupStatus(true);
    });

    it("Instance level signup and group sync cases", () => {
        const orgId = Cypress.env("workspaceId");
        createGroup(data.groupName);

        OidcConfig({ Everyone: data.groupName }, "instance", {
            organizationId: orgId,
            id: "1",
        });
        cy.apiLogout();
        cy.wait(2000);

        loginWithOIDC({
            username: Cypress.env("okta_inst_user"),
            password: Cypress.env("okta_password"),
            redirectUri: Cypress.env("okta_inst_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });

        verifyUserRole("@userId", "end-user", [data.groupName]);

        logout();

        cy.apiLogin();
        OidcConfig({ Everyone: "Admin" }, "instance", {
            organizationId: orgId,
            id: "1",
        });
        cy.apiLogout();
        cy.wait(2000);

        loginWithOIDC({
            username: Cypress.env("okta_inst_user"),
            password: Cypress.env("okta_password"),
            redirectUri: Cypress.env("okta_inst_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });

        verifyUserRole("@userId", "admin", ["admin"]);
    });

    it("Workspace signup and group cases", () => {
        const orgId = Cypress.env("workspaceId");
        cy.getSsoConfigId("openid").then((id) => {
            if (!id) {
                updateOIDCConfig(orgId);
            }
        });

        OidcConfig({ Everyone: "Admin" });
        cy.apiLogout();
        cy.wait(2000);

        loginWithOIDC({
            username: Cypress.env("okta_user"),
            password: Cypress.env("okta_password"),
            redirectUri: Cypress.env("okta_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });

        verifyUserRole("@userId", "admin");
        logout();

        cy.apiLogin();
        OidcConfig({ Everyone: "Builder" });
        cy.apiLogout();
        cy.wait(2000);

        loginWithOIDC({
            username: Cypress.env("okta_user"),
            password: Cypress.env("okta_password"),
            redirectUri: Cypress.env("okta_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });

        verifyUserRole("@userId", "builder");

        cy.apiCreateApp(data.appName);
        logout();

        cy.apiLogin();
        OidcConfig({ Everyone: "End-user" });
        cy.apiLogout();
        cy.wait(2000);

        loginWithOIDC({
            username: Cypress.env("okta_user"),
            password: Cypress.env("okta_password"),
            redirectUri: Cypress.env("okta_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });

        verifyUserRole("@userId", "end-user");
    });

    it("Invited user onboarding using sso", () => {
        const orgId = Cypress.env("workspaceId");
        const invitedUserEmail = Cypress.env("okta_invite_user");
        const firstName = fake.firstName;
        cy.intercept("GET", "/api/authorize").as("openidResponse");

        cy.getSsoConfigId("openid").then((id) => {
            if (!id) {
                updateOIDCConfig(orgId);
            }
        });

        OidcConfig({ Everyone: "Admin" });

        // Create and setup invitation
        cy.apiUserInvite(firstName, invitedUserEmail);
        fetchAndVisitInviteLink(invitedUserEmail);

        // Start SSO login process
        cy.oidcLogin({
            username: invitedUserEmail,
            password: Cypress.env("okta_invite_pass"),
            redirectUri: Cypress.env("okta_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });
        cy.wait(4000);
        cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
            "have.text",
            "Join My workspace"
        );
        cy.get(commonSelectors.acceptInviteButton).click();
        // Verify successful login and role
        cy.wait("@openidResponse").then((interception) => {
            const userId = interception.response.body.id;
            cy.wrap(userId).as("userId");
        });

        //need to check the flow here
        // if (commonSelectors.invitePageHeader.length > 0) {
        //     cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
        //         "have.text",
        //         "Join My workspace"
        //     );
        //     cy.get(commonSelectors.acceptInviteButton).click();
        // }

        verifyUserRole("@userId", "admin");
    });
});
