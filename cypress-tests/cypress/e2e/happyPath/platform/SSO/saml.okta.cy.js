import { fake } from "Fixtures/fake";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoEeSelector, commonEeSelectors } from "Selectors/eeCommon";
import { ssoText, ssoEeText } from "Texts/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { deleteOrganisationSSO } from "Support/utils/manageSSO";
import * as common from "Support/utils/common";
import {
    createGroup,
    deleteGroup,
    verifyUserRole,
} from "Support/utils/manageGroups";
import { setSignupStatus, updateSsoId } from "Support/utils/manageSSO";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

describe("SAML SSO", () => {
    const data = {
        appName: `${fake.companyName}-SAML-App`,
        groupName: `saml-${fake.companyName}-group`,
    };

    const config = {
        type: "saml",
        configs: {
            name: "SAML_workspace",
            idpMetadata: Cypress.env("saml_idp_metadata"),
            groupAttribute: "groups",
        },
        enabled: true,
    };

    beforeEach("", () => {
        cy.apiLogin();
        deleteOrganisationSSO("My workspace", ["saml"]);
        setSignupStatus(true);
    });

    after(() => {
        deleteGroup("SAML", Cypress.env("workspaceId"));
    });

    it("Should verify SAML modal elements", () => {
        cy.visit("/");
        common.navigateToManageSSO();
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
        cy.visit("/login/my-workspace");
        cy.get(ssoEeSelector.saml.ssoText).should("be.visible");
    });

    it("Should verify SAML sso signup and group sync", () => {
        const orgId = Cypress.env("workspaceId");
        const ssoConfigId = Cypress.env("saml_config_id");

        cy.apiUpdateSSOConfig(config);

        createGroup("SAML");

        updateSsoId(ssoConfigId, "saml", orgId);

        cy.apiLogout();
        cy.visit("/login/my-workspace");

        cy.intercept("GET", "/api/authorize").as("openidResponse");
        cy.get(ssoEeSelector.saml.ssoText).click();
        cy.wait(2000);
        cy.clearAndType('input[name="identifier"]', Cypress.env("saml_signup"));
        cy.get(".button-primary").click();
        cy.wait(2000);
        cy.clearAndType(
            'input[name="credentials.passcode"]',
            Cypress.env("okta_password")
        );
        cy.get(".button-primary").click();
        cy.wait(3000);

        cy.wait("@openidResponse").then((interception) => {
            const userId = interception.response.body.id;
            cy.wrap(userId).as("userId");
        });

        verifyUserRole("@userId", "end-user", ["SAML"]);
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
        cy.get(ssoEeSelector.saml.ssoText).click();
        cy.wait(2000);
        cy.clearAndType('input[name="identifier"]', invitedUserEmail);
        cy.get(".button-primary").click();
        cy.wait(2000);
        cy.clearAndType(
            'input[name="credentials.passcode"]',
            Cypress.env("okta_password")
        );
        cy.get(".button-primary").click();
        cy.wait(3000);

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

        verifyUserRole("@userId", "builder", ["builder"]);
    });
});
