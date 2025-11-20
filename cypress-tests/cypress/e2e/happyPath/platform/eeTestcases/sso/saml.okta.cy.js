import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { ssoSelector } from "Selectors/manageSSO";
import { navigateToManageSSO, sanitize } from "Support/utils/common";
import {
    apiCreateGroup,
    apiDeleteGroup,
    verifyUserRole,
} from "Support/utils/manageGroups";
import { deleteOrganisationSSO } from "Support/utils/manageSSO";
import { cleanAllUsers } from "Support/utils/manageUsers";
import { ssoEeText, ssoText } from "Texts/manageSSO";

import {
    setSignupStatus,
    uiOktaLogin,
    updateSsoId,
} from "Support/utils/manageSSO";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

const loginViaSamlSSO = (email, password) => {
    cy.intercept("GET", "/api/authorize").as("openidResponse");
    cy.get(ssoEeSelector.saml.ssoText).click();
    cy.wait(2000);
    uiOktaLogin(email, password);
    cy.wait(3000);
};

describe("SAML SSO", () => {
    const data = {
        appName: `${fake.companyName}-SAML-App`,
        groupName: `saml-${fake.companyName}-group`,
    };

    const config = {
        type: "saml",
        configs: {
            groupAttribute: "groups",
            groupSyncEnabled: true,
            idpMetadata: Cypress.env("saml_idp_metadata"),
            name: "SAML_workspace",
        },
        enabled: true,
    };

    const deleteGroup = (orgId) => {
        cy.runSqlQuery(
            `SELECT id FROM permission_groups WHERE name = 'SAML' AND organization_id = '${orgId}';`
        ).then(({ rows }) => {
            const existingGroupId = rows?.[0]?.id;
            if (existingGroupId) {
                cy.runSqlQuery(
                    `DELETE FROM permission_groups WHERE id = '${existingGroupId}'::uuid;`
                );
            }
        });
    };

    beforeEach("", () => {
        data.workspaceName = `${sanitize(fake.firstName)}-saml`;
        data.workspaceSlug = `${sanitize(fake.firstName)}-saml`;

        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
            (res) => {
                Cypress.env("workspaceId", res.body.organization_id);
            }
        );

        deleteOrganisationSSO(data.workspaceName, ["saml"]);
        setSignupStatus(true);
        cleanAllUsers();
    });

    after("", () => {
        cy.apiLogin();
        cleanAllUsers();
        cy.apiDeleteAllApps();
    });

    afterEach("", () => {
        cy.apiLogin();
        deleteOrganisationSSO(data.workspaceName, ["saml"]);
    });

    it("Should verify SAML modal elements", () => {
        cy.visit(`${data.workspaceSlug}`);
        navigateToManageSSO();
        cy.get(ssoEeSelector.saml.card).should("be.visible");
        cy.get(ssoEeSelector.saml.label).verifyVisibleElement("have.text", "SAML");
        cy.get(`${ssoEeSelector.saml.card} > .switch > .slider`).should(
            "be.visible"
        );
        cy.wait(1000);
        cy.get(ssoEeSelector.saml.card).click();

        cy.get(`${ssoEeSelector.saml.toggleInput} > .slider`).should("be.visible");
        cy.get(ssoSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        for (const elements in ssoEeSelector.samlModalElements) {
            cy.get(ssoEeSelector.samlModalElements[elements]).verifyVisibleElement(
                "have.text",
                ssoEeText.samlModalElements[elements]
            );
        }
        cy.get(ssoEeSelector.saml.nameInput).should("be.visible");
        cy.get(ssoEeSelector.saml.metadataInput).should("be.visible");
        cy.get(ssoEeSelector.saml.groupAttributeInput).should("be.visible");

        cy.get(ssoEeSelector.saml.toggleInput).click();
        cy.get(commonEeSelectors.cancelButton).eq(1).click();
        cy.get(ssoEeSelector.saml.card).click();
        cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        cy.clearAndType(ssoEeSelector.saml.nameInput, "SAML");
        cy.clearAndType(ssoEeSelector.saml.metadataInput, ssoEeText.testclientId);
        cy.clearAndType(
            ssoEeSelector.saml.groupAttributeInput,
            ssoEeText.testclientId
        );

        cy.get('[data-cy="saml-toggle-input"] > .slider').click();
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Saved SAML SSO configurations"
        );
        cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoEeText.enabledLabel
        );
        cy.get(ssoEeSelector.redirectUrlLabel).verifyVisibleElement(
            "have.text",
            ssoText.redirectUrlLabel
        );
        cy.get(ssoSelector.redirectUrl).should("be.visible");
        cy.get(ssoEeSelector.saml.copyIcon).should("be.visible");

        cy.apiLogout();
        cy.visit(`/login/${data.workspaceSlug}`);
        cy.get(ssoEeSelector.saml.ssoText).should("be.visible");
    });

    it("Should verify SAML sso signup and group sync", () => {
        const orgId = Cypress.env("workspaceId");
        const ssoConfigId = Cypress.env("saml_config_id");
        deleteGroup(orgId);

        cy.apiUpdateSSOConfig(config);

        apiCreateGroup("SAML");

        updateSsoId(ssoConfigId, "saml", orgId);

        cy.apiLogout();
        cy.visit(`/login/${data.workspaceSlug}`);
        loginViaSamlSSO(Cypress.env("saml_signup"), Cypress.env("okta_password"));
        cy.wait("@openidResponse").then((interception) => {
            const userId = interception.response.body.id;
            cy.wrap(userId).as("userId");
        });
        verifyUserRole("@userId", "end-user", ["SAML"]);

        cy.apiLogout();
        cy.apiLogin();
        apiDeleteGroup("SAML");
    });

    it("Should verify the invited user onboarding using SAML SSO", () => {
        const orgId = Cypress.env("workspaceId");
        const ssoConfigId = Cypress.env("saml_config_id");
        const invitedUserEmail = Cypress.env("saml_invite");
        const firstName = fake.firstName;
        cy.intercept("GET", "/api/authorize").as("openidResponse");

        cy.apiUpdateSSOConfig(config);
        updateSsoId(ssoConfigId, "saml", orgId);

        // Create and setup invitation
        cy.apiUserInvite(firstName, invitedUserEmail);
        fetchAndVisitInviteLink(invitedUserEmail);

        // Start SSO login process
        loginViaSamlSSO(invitedUserEmail, Cypress.env("okta_password"));

        cy.get(
            `[data-cy="join-${data.workspaceName}-header"]`
        ).verifyVisibleElement("have.text", `Join ${data.workspaceName}`);
        cy.get(commonSelectors.acceptInviteButton).click();

        // Verify successful login and role
        cy.wait("@openidResponse").then((interception) => {
            const userId = interception.response.body.id;
            cy.wrap(userId).as("userId");
        });

        verifyUserRole("@userId", "builder", ["builder"]);
    });
});
