import { ssoSelector } from "Selectors/manageSSO";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
    oidcSSOPageElements,
    disableSSO,
    setSignupStatus,
    deleteOrganisationSSO,
} from "Support/utils/eeCommon";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";

describe("Manage SSO for multi workspace", () => {
    const data = {};
    const envVar = Cypress.env("environment");

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        deleteOrganisationSSO("My workspace", [
            "google",
            "git",
            "openid",
            "saml",
            "ldap",
        ]);
    });
    it("Should verify General settings page elements", () => {
        SSO.defaultSSO(true);
        setSignupStatus(false);
        common.navigateToManageSSO();
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq(
                commonText.breadcrumbworkspaceSettingTitle
            );
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            ssoText.pagetitle
        );

        cy.get(ssoSelector.cardTitle).verifyVisibleElement(
            "have.text",
            "Workspace login"
        );
        for (const elements in ssoSelector.generalSettingsElements) {
            cy.get(ssoSelector.workspaceLoginPage[elements]).verifyVisibleElement(
                "have.text",
                ssoText.workspaceLoginPage[elements]
            );
        }
        cy.get(ssoSelector.enableSignUpToggle).should("be.visible");
        cy.get(ssoSelector.allowedDomainInput).should("be.visible");
        cy.get(ssoSelector.workspaceLoginUrl).should("be.visible");
        cy.get(commonSelectors.copyIcon).should("be.visible");

        cy.get(ssoSelector.cancelButton).verifyVisibleElement(
            "have.text",
            ssoText.cancelButton
        );
        cy.get(ssoSelector.saveButton).verifyVisibleElement(
            "have.text",
            ssoText.saveButton
        );

        cy.get(ssoSelector.passwordEnableToggle).should("be.visible");
        cy.get(ssoSelector.passwordLoginToggleLbale).verifyVisibleElement(
            "have.text",
            ssoText.passwordLoginToggleLbale
        );
        cy.get(ssoSelector.disablePasswordHelperText).verifyVisibleElement(
            "have.text",
            ssoText.disablePasswordHelperText
        );

        SSO.generalSettings();
    });

    it("Should verify Google SSO modal elements", () => {
        SSO.setSSOStatus("My workspace", "google", false);

        common.navigateToManageSSO();
        cy.get(ssoSelector.google).should("be.visible").click();
        cy.get(ssoSelector.cardTitle)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.googleTitle);
        cy.get(ssoSelector.googleEnableToggle).should("be.visible");
        cy.get(ssoSelector.clientIdLabel).verifyVisibleElement(
            "have.text",
            ssoText.clientIdLabel
        );
        cy.get(ssoSelector.clientIdInput).should("be.visible");
        cy.get(ssoSelector.cancelButton)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.cancelButton);
        cy.get(ssoSelector.saveButton)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.saveButton);

        SSO.googleSSOPageElements();
        SSO.defaultSSO(false);
        cy.logoutApi();
        cy.visit("/login/my-workspace");
        cy.get(ssoSelector.googleIcon).should("be.visible");
        cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
            "have.text",
            ssoText.googleSSOText
        );
    });

    it("Should verify Git SSO modal elements", () => {
        SSO.defaultSSO(true);

        SSO.setSSOStatus("My workspace", "git", false);
        common.navigateToManageSSO();

        cy.get(ssoSelector.git).should("be.visible").click();
        cy.get(ssoSelector.githubLabel).verifyVisibleElement(
            "have.text",
            ssoText.gitTitle
        );

        cy.get(ssoSelector.hostNameLabel).verifyVisibleElement(
            "have.text",
            ssoText.hostNameLabel
        );
        cy.get(ssoSelector.hostNameInput).should("be.visible");
        cy.get(ssoSelector.hostNameHelpText).verifyVisibleElement(
            "have.text",
            ssoText.hostNameHelpText
        );
        cy.get(ssoSelector.gitEnableToggle).should("be.visible");
        cy.get(ssoSelector.clientIdLabel).verifyVisibleElement(
            "have.text",
            ssoText.clientIdLabel
        );
        cy.get(ssoSelector.clientIdInput).should("be.visible");
        cy.get(ssoSelector.clientSecretLabel)
            .should(($el) => {
                expect($el.contents().first().text().trim()).to.eq(
                    ssoText.clientSecretLabel
                );
            })
            .and("be.visible");
        cy.get(ssoSelector.encriptedLabel).verifyVisibleElement(
            "have.text",
            ssoText.encriptedLabel
        );
        cy.get(ssoSelector.clientSecretInput).should("be.visible");
        cy.get(ssoSelector.cancelButton)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.cancelButton);
        cy.get(ssoSelector.saveButton)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.saveButton);

        SSO.gitSSOPageElements();
        SSO.defaultSSO(false);

        cy.logoutApi();
        cy.visit("/login/my-workspace");

        cy.get(ssoSelector.gitIcon).should("be.visible");
        cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
            "have.text",
            ssoText.gitSignInText
        );
    });

    it("Should verify openID modal elements", () => {
        SSO.defaultSSO(true);

        SSO.setSSOStatus("My workspace", "openid", false);

        common.navigateToManageSSO();
        cy.wait(1000);
        cy.get('[data-cy="openid-connect-label"]').verifyVisibleElement(
            "have.text",
            "OpenID Connect"
        );
        cy.get('[data-cy="openid-connect-sso-card"] > .switch > .slider').should(
            "be.visible"
        );
        cy.get(ssoEeSelector.oidc).dblclick();

        cy.get(ssoEeSelector.oidcToggle).should("be.visible");
        cy.get(ssoEeSelector.statusLabel).should("be.visible");

        for (const elements in ssoEeSelector.oidcPageElements) {
            cy.get(ssoEeSelector.oidcPageElements[elements]).verifyVisibleElement(
                "have.text",
                ssoEeText.oidcPageElements[elements]
            );
        }
        cy.get(ssoEeSelector.nameInput).should("be.visible");
        cy.get(ssoEeSelector.clientIdInput).should("be.visible");
        cy.get(ssoEeSelector.clientSecretInput).should("be.visible");
        cy.get(ssoEeSelector.WellKnownUrlInput).should("be.visible");

        cy.get(commonEeSelectors.cancelButton)
            .eq(1)
            .verifyVisibleElement("have.text", commonEeText.cancelButton);
        cy.get(commonEeSelectors.saveButton)
            .eq(1)
            .verifyVisibleElement("have.text", commonEeText.saveButton);

        oidcSSOPageElements();
        SSO.defaultSSO(false);

        cy.logoutApi();
        cy.visit("/login/my-workspace");

        cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
            "have.text",
            "Sign in with Tooljet OIDC"
        );
    });

    it("Should verify SAML modal elements", () => {
        SSO.defaultSSO(false);
        SSO.setSSOStatus("My workspace", "git", false);
        common.navigateToManageSSO();
        cy.get('[data-cy="saml-sso-card"]').should("be.visible");
        cy.get('[data-cy="saml-label"]').verifyVisibleElement("have.text", "SAML");
        cy.get('[data-cy="saml-sso-card"] > .switch > .slider').should(
            "be.visible"
        );
        cy.wait(1000);
        cy.get('[data-cy="saml-sso-card"]').click();

        cy.get('[data-cy="saml-toggle-input"] > .slider').should("be.visible");
        cy.get('[data-cy="status-label"]').verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        for (const elements in ssoEeSelector.samlModalElements) {
            cy.get(ssoEeSelector.samlModalElements[elements]).verifyVisibleElement(
                "have.text",
                ssoEeText.samlModalElements[elements]
            );
        }
        cy.get('[data-cy="name-input"]').should("be.visible");
        cy.get('[data-cy="dp-metadata-input"]').should("be.visible");
        cy.get('[data-cy="group-attribute-input"]').should("be.visible");

        cy.get('[data-cy="saml-toggle-input"] > .slider').click();
        cy.get('[data-cy="cancel-button"]').eq(1).click();
        cy.get('[data-cy="saml-sso-card"]').click();
        cy.get('[data-cy="status-label"]').verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        cy.clearAndType('[data-cy="name-input"]', "SAML");
        cy.clearAndType('[data-cy="dp-metadata-input"]', ssoEeText.testclientId);
        cy.clearAndType(
            '[data-cy="group-attribute-input"]',
            ssoEeText.testclientId
        );

        cy.get('[data-cy="saml-toggle-input"] > .slider').click();
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Saved SAML SSO configurations"
        );
        cy.get('[data-cy="status-label"]').verifyVisibleElement(
            "have.text",
            ssoEeText.enabledLabel
        );
        cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
            "have.text",
            ssoText.redirectUrlLabel
        );
        cy.get('[data-cy="redirect-url"]').should("be.visible");
        cy.get('[data-cy="copy-icon"]').should("be.visible");

        cy.logoutApi();
        cy.visit("/login/my-workspace");
        cy.get('[data-cy="saml-sso-text"]')
            .should("be.visible")

    });
});
