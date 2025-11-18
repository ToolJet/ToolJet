import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { logout } from "Support/utils/common";
import {
    apiCreateGroup,
    apiDeleteGroup,
    verifyUserRole,
} from "Support/utils/manageGroups";
import {
    addOIDCConfig,
    deleteOrganisationSSO,
    enableInstanceSignup,
    setSignupStatus,
    updateOIDCConfig,
} from "Support/utils/manageSSO";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";
import { cleanAllUsers } from "Support/utils/manageUsers";

describe("Okta OIDC", () => {
    let data;

    data = {
        appName: `${fake.companyName}-IE-App`,
        groupName: `oidc-${fake.companyName}-group`,
    };

    beforeEach("", () => {
        data.groupName = `oidc-${fake.companyName}-group`;

        cy.apiLogin();

        deleteOrganisationSSO("My workspace", ["openid"]);
        enableInstanceSignup();
        setSignupStatus(true);
    });

    afterEach("", () => {
        cy.apiLogin();
        cleanAllUsers();
        cy.apiDeleteAllApps()
    });

    it("Instance level signup and group sync cases", () => {
        const orgId = Cypress.env("workspaceId");

        apiCreateGroup(data.groupName);

        addOIDCConfig({ Everyone: data.groupName }, "instance", {
            organizationId: orgId,
            id: "1",
        });
        cy.apiLogout();
        cy.wait(3000);

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

        apiDeleteGroup(data.groupName);
        apiCreateGroup(data.groupName);
        addOIDCConfig({ Everyone: "Admin", OIDC: data.groupName }, "instance", {
            organizationId: orgId,
            id: "1",
        });
        cy.apiLogout();
        cy.wait(1000);

        loginWithOIDC({
            username: Cypress.env("okta_inst_user"),
            password: Cypress.env("okta_password"),
            redirectUri: Cypress.env("okta_inst_redirect_uri"),
            clientId: Cypress.env("okta_client_id"),
            clientSecret: Cypress.env("okta_client_secret"),
            oktaDomain: Cypress.env("okta_domain"),
            organizationId: orgId,
        });

        verifyUserRole("@userId", "admin", ["admin", data.groupName]);
        apiDeleteGroup(data.groupName);
    });

    it("Workspace signup and group cases", () => {
        const orgId = Cypress.env("workspaceId");
        cy.getSsoConfigId("openid").then((id) => {
            if (!id) {
                updateOIDCConfig(orgId);
            }
        });

        addOIDCConfig({ Everyone: "Admin" });
        cy.apiLogout();
        cy.wait(4000);

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
        addOIDCConfig({ Everyone: "Builder" });
        cy.apiLogout();
        cy.wait(1000);

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

        addOIDCConfig({ Everyone: "End-user" });
        cy.apiLogout();
        cy.wait(1000);

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
        apiCreateGroup(data.groupName);

        cy.intercept("GET", "/api/authorize").as("openidResponse");

        cy.getSsoConfigId("openid").then((id) => {
            if (!id) {
                updateOIDCConfig(orgId);
            }
        });

        addOIDCConfig({ Everyone: "builder", OIDC: data.groupName });

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
        cy.wait(4000);

        cy.wait("@openidResponse").then((interception) => {
            const userId = interception.response.body.id;
            cy.wrap(userId).as("userId");
        });
        cy.wait(4000);

        verifyUserRole("@userId", "builder", ["builder", data.groupName]);

        cy.apiLogout();
        cy.apiLogin();
        apiDeleteGroup(data.groupName);
    });
});

const loginWithOIDC = (params, alias = "@userId") => {
    cy.intercept("GET", "/api/authorize").as("openidResponse");
    cy.oidcLogin(params);
    cy.wait("@openidResponse").then((interception) => {
        const userId = interception.response.body.id;
        cy.wrap(userId).as(alias.replace("@", ""));
    });
    cy.wait(4000);
};
