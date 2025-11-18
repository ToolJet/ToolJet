import { commonSelectors } from "Selectors/common";
import {
    commonEeSelectors,
    instanceSettingsSelector,
    ssoEeSelector,
} from "Selectors/eeCommon";
import * as common from "Support/utils/common";
import {
    defaultSSO,
    setSignupStatus
} from "Support/utils/manageSSO";
import {
    apiArchiveUnarchiveUser,
    cleanAllUsers
} from "Support/utils/manageUsers";
import { ssoText } from "Texts/manageSSO";
import { usersText } from "Texts/manageUsers";

import { fake } from "Fixtures/fake";
import { enableInstanceSignup } from "Support/utils/manageSSO";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

const updateOIDCConfig = (level) => {
    let config = {
        type: "openid",
        configs: {
            name: "",
            clientId: Cypress.env("SSO_OPENID_CLIENT_ID"),
            clientSecret: Cypress.env("SSO_OPENID_CLIENT_SECRET"),
            codeVerifier: "",
            grantType: "authorization_code",
            wellKnownUrl: Cypress.env("SSO_OPENID_WELL_KNOWN_URL"),
            ...(level === "instance" ? { enableGroupSync: true } : {}),
        },
        enabled: true,
        oidcGroupSyncs: [
            {
                claimName: "groups",
                groupMapping: "{}",
            },
        ],
    };
    return config;
};

describe("Verify OIDC user onboarding", () => {
    const envVar = Cypress.env("environment");

    let data = {};

    beforeEach(() => {
        data.workspaceName = `${fake.companyName.toLowerCase()}-workspace`;
        cy.apiLogin();
        cy.intercept("GET", "api/library_apps").as("apps");
        cleanAllUsers();

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName).then(
            (response) => {
                Cypress.env("workspaceId", response.body.organization_id);
            }
        );
        cy.visit(`${data.workspaceName}`);
    });

    after("", () => {
        cy.apiLogin();
        cleanAllUsers();
    });

    it("Verify user onboarding using workspace OIDC", () => {
        defaultSSO(false);
        setSignupStatus(false, data.workspaceName);
        common.navigateToManageSSO();
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
        cy.get('[data-cy="openid-toggle-label"]').click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            ssoText.toggleUpdateToast("OpenID")
        );

        cy.apiLogout();
        cy.visit(`/login/${data.workspaceName}`);
        cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
            "have.text",
            "Sign in with Tooljet OIDC"
        );
        cy.get(ssoEeSelector.oidcSSOText).click();
        cy.get(".superadmin-button").click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Open ID login failed - User does not exist in the workspace"
        );

        cy.apiLogin();
        setSignupStatus(true);
        cy.apiLogout();

        cy.visit(`/login/${data.workspaceName}`);
        cy.get(ssoEeSelector.oidcSSOText).click();
        cy.get(".superadmin-button").click();

        common.logout();

        cy.apiLogin();
        cy.visit(`${data.workspaceName}/workspace-settings/users`);
        common.searchUser("superadmin@tooljet.com");
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            data.workspaceName
        );

        cy.contains("td", "superadmin@tooljet.com")
            .parent()
            .within(() => {
                cy.get("td small").should("have.text", usersText.activeStatus);
            });

        cy.apiLogout();
    });

    it("Verify invited user onboarding using instance level OIDC", () => {
        setSignupStatus(true);
        cy.ifEnv("Enterprise", () => {
            enableInstanceSignup();
        });
        cy.apiUserInvite("user", "user@tooljet.com");
        fetchAndVisitInviteLink("user@tooljet.com", data.workspaceName);
        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).click();
        cy.get(".user-button").click();
        cy.wait(1000);

        cy.get(commonSelectors.acceptInviteButton).click();
        cy.wait("@apps");
        cy.contains(data.workspaceName).should("be.visible");
        common.logout();
    });

    it("Verify sign up using different email invitation link using instance level OIDC", () => {
        setSignupStatus(false);
        cy.apiUserInvite("user", "userthree@tooljet.com");
        fetchAndVisitInviteLink("userthree@tooljet.com", data.workspaceName);
        cy.wait(2000);
        cy.get(ssoEeSelector.oidcSSOText).click();
        cy.get(".user-four-button").click();

        cy.get(commonSelectors.toastMessage)
            .should("be.visible")
            .and(
                "have.text",
                "Open ID login failed - Invalid Email: Please use the email address provided in the invitation."
            );
        cy.wait(500);
    });

    if (envVar === "Enterprise") {
        it("Verify user onboarding using instance level OIDC", () => {
            enableInstanceSignup();
            cy.apiLogout();

            cy.visit("/");
            cy.get(ssoEeSelector.oidcSSOText).click();
            cy.get(".admin-button").click();
            cy.wait(3000);
            cy.get(commonSelectors.workspaceName).verifyVisibleElement(
                "have.text",
                'My workspace'
            );
            common.logout();

            cy.apiLogin();
            cy.visit("/");
            cy.get(commonSelectors.settingsIcon).click();
            cy.get(commonEeSelectors.instanceSettingIcon).click();
            cy.clearAndType(commonSelectors.inputUserSearch, "admin@tooljet.com");

            cy.get(instanceSettingsSelector.userStatus("admin")).verifyVisibleElement(
                "have.text",
                usersText.activeStatus
            );

            cy.apiLogout();
        });
    }

    it("Verify archived user login using OIDC", () => {
        setSignupStatus(true);
        cy.ifEnv("Enterprise", () => {
            enableInstanceSignup();
        });
        cy.apiFullUserOnboarding("user two", "usertwo@tooljet.com")

        cy.apiLogout();

        cy.apiLogin();
        apiArchiveUnarchiveUser("usertwo@tooljet.com", "archive", Cypress.env("workspaceId"));
        cy.apiLogout();

        cy.visit(`${data.workspaceName}`);
        cy.wait(3000);
        cy.get(ssoEeSelector.oidcSSOText).click();
        cy.wait(3000);
        cy.get(".user-two-button").click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Open ID login failed - User is archived in the workspace"
        );

        cy.apiLogin();
        apiArchiveUnarchiveUser("usertwo@tooljet.com", "unarchive", Cypress.env("workspaceId"));
        cy.apiLogout();

        cy.visit(`${data.workspaceName}`);
        cy.wait(3000);
        cy.get(ssoEeSelector.oidcSSOText).click();
        cy.wait(3000);
        cy.get(".user-two-button").click();

        cy.contains(data.workspaceName).should("be.visible");

    });
});
