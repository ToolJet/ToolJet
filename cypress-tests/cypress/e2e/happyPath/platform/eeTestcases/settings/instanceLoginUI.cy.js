import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
    openInstanceSettings,
    InstanceSSO,
    verifyTooltipDisabled,
    allowPersonalWorkspace,
    resetInstanceDomain,
    instanceSSOConfig,
    updateAutoSSOToggle,
    passwordToggle,
} from "Support/utils/platform/eeCommon";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";

describe("Instance login", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        instanceSSOConfig();
        passwordToggle(true);
        updateAutoSSOToggle();
    });
    it("Should verify instance login page elements", () => {
        InstanceSSO(false, false, false);
        resetInstanceDomain(false);
        cy.reload();
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();

        cy.get(commonSelectors.breadcrumbHeaderTitle("settings")).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Settings");
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            "Instance login"
        );

        for (const elements in ssoSelector.instanceLoginPage) {
            cy.get(ssoSelector.instanceLoginPage[elements]).verifyVisibleElement(
                "have.text",
                ssoText.instanceLoginPage[elements]
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

        //Configure sign up toggle
        cy.get(ssoSelector.enableSignUpToggle).check();
        cy.get(ssoSelector.cancelButton).click();
        cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");
        cy.get(ssoSelector.enableSignUpToggle).check();
        cy.get(ssoSelector.saveButton).click();
        cy.get(ssoSelector.enableSignUpToggle).should("be.checked");
        cy.wait(500);
        cy.get(ssoSelector.enableSignUpToggle).uncheck();
        cy.get(ssoSelector.saveButton).click();
        cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");

        cy.clearAndType(ssoSelector.allowedDomainInput, ssoText.allowedDomain);
        cy.get(ssoSelector.saveButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Instance settings have been updated"
        );

        cy.get(ssoSelector.passwordEnableToggle).uncheck();
        cy.get(ssoSelector.disablePasswordLoginTitle).verifyVisibleElement(
            "have.text",
            ssoText.disablePasswordLoginTitle
        );
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            ssoText.passwordDisableWarning
        );
        cy.get(ssoSelector.superAdminInfoText).verifyVisibleElement(
            "have.text",
            ssoText.superAdminInfoText
        );
        cy.get('[data-cy="copy-icon"]:eq(1)').should("be.visible");

        cy.get(commonSelectors.cancelButton).eq(1).click();
        cy.get(ssoSelector.passwordEnableToggle).uncheck();
        cy.get(commonSelectors.confirmationButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            ssoText.passwordDisabledToast
        );

        cy.get(ssoSelector.passwordEnableToggle).check();
        cy.get(commonSelectors.saveButton).click();

        cy.get(ssoSelector.autoSSOToggle).should("be.disabled");
        verifyTooltipDisabled(ssoSelector.autoSSOToggle,
            ssoText.autoSSOToggleMessage
        );

        cy.task("dbConnection", {
            dbconfig: Cypress.env("app_db"),
            sql: "UPDATE sso_configs SET enabled = true WHERE sso='google' AND organization_id IS NULL;UPDATE sso_configs SET enabled = false WHERE sso IN ('git','openid') AND organization_id IS NULL;",
        });
        passwordToggle(false);

        cy.reload();
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();
        cy.get(ssoSelector.autoSSOToggle).should("not.be.disabled").check();
        cy.get(ssoSelector.modalMessage).should("be.visible");
        cy.get(commonSelectors.confirmationButton).click();
        cy.get(ssoSelector.autoSSOToggle).should("be.checked");

        cy.get(ssoSelector.passwordEnableToggle).check();
        cy.get(commonSelectors.enablePasswordLoginTitle).should("be.visible").verifyVisibleElement(
            "have.text",
            commonText.enablePasswordLoginTitle
        );
        cy.get(commonSelectors.enablePasswordLoginModal).verifyVisibleElement(
            "have.text",
            commonText.enablePasswordLoginModal
        );
        cy.get(commonSelectors.cancelButton).eq(1).click();
        cy.get(ssoSelector.passwordEnableToggle).should("not.be.checked");
        cy.get(ssoSelector.passwordEnableToggle).check();
        cy.get(commonSelectors.confirmationButton).click();
        cy.get(ssoSelector.passwordEnableToggle).should("be.checked");
        cy.get(commonSelectors.saveButton).click();
        cy.get(ssoSelector.autoSSOToggle).should("not.be.checked").and("be.disabled");

        cy.get(ssoSelector.linkReadDocumentation).should("be.visible")
            .and("have.attr", "href")
            .and("include", "/enterprise/superadmin/#instance-login");

        instanceSSOConfig(false);
        passwordToggle(true);
        cy.reload();
        cy.get(ssoSelector.passwordEnableToggle).should("be.disabled");

        verifyTooltipDisabled(
            ssoSelector.passwordEnableToggle,
            "Password login cannot be disabled unless SSO is configured"
        );
    });
    it("Should verify Google SSO modal elements", () => {
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();

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
        cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
            "have.text",
            ssoText.redirectUrlLabel
        );
        cy.get('[data-cy="redirect-url"]').should("be.visible");
        cy.get('[data-cy="copy-icon"]').should("be.visible");

        cy.get(ssoSelector.cancelButton)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.cancelButton);
        cy.get(ssoSelector.saveButton)
            .eq(1)
            .verifyVisibleElement("have.text", ssoText.saveButton);

        cy.get(ssoSelector.googleEnableToggle).click();
        cy.get(ssoSelector.saveButton).eq(1).click();

        cy.get(ssoSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        cy.clearAndType(ssoSelector.clientIdInput, ssoText.testClientId);
        cy.get(ssoSelector.cancelButton).eq(1).click();
        cy.get(ssoSelector.google).click();
        cy.get(ssoSelector.googleEnableToggle).click();
        cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleSSOToast);
        cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);

        cy.apiLogout();
        cy.visit("/login/my-workspace");
        cy.get(ssoSelector.googleIcon).should("be.visible");
        cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
            "have.text",
            ssoText.googleSSOText
        );
    });
    it("Should verify Git SSO modal elements", () => {
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();

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

        cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
            "have.text",
            ssoText.redirectUrlLabel
        );
        cy.get('[data-cy="redirect-url"]').should("be.visible");
        cy.get('[data-cy="copy-icon"]').should("be.visible");

        cy.get(ssoSelector.gitEnableToggle).click();
        cy.get(ssoSelector.saveButton).eq(1).click();

        cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);
        cy.get(ssoSelector.statusLabel).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        cy.get(ssoSelector.gitEnableToggle).click();
        cy.clearAndType(ssoSelector.hostNameInput, ssoText.hostName);
        cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
        cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);
        cy.get(ssoSelector.hostNameInput).should("have.value", ssoText.hostName);
        cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
        cy.get(ssoSelector.clientSecretInput).should(
            "have.value",
            ssoText.testClientId
        );

        cy.apiLogout();
        cy.visit("/login/my-workspace");

        cy.get(ssoSelector.gitIcon).should("be.visible");
        cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
            "have.text",
            ssoText.gitSignInText
        );
    });
    it("Should verify openID modal elements", () => {
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();

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

        cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
            "have.text",
            ssoText.redirectUrlLabel
        );
        cy.get('[data-cy="redirect-url"]').should("be.visible");
        cy.get('[data-cy="copy-icon"]').should("be.visible");

        cy.get(ssoEeSelector.oidcToggle).click();
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            ssoText.toggleUpdateToast("OpenID")
        );
        cy.get(`.modal-header ${ssoSelector.statusLabel}`).verifyVisibleElement(
            "have.text",
            ssoText.disabledLabel
        );

        cy.get(ssoEeSelector.oidcToggle).click();
        cy.clearAndType(ssoEeSelector.nameInput, ssoEeText.testName);
        cy.clearAndType(ssoEeSelector.clientIdInput, ssoEeText.testclientId);
        cy.clearAndType(
            ssoEeSelector.clientSecretInput,
            ssoEeText.testclientSecret
        );
        cy.clearAndType(
            ssoEeSelector.WellKnownUrlInput,
            ssoEeText.testWellknownUrl
        );
        cy.get(ssoSelector.saveButton).eq(1).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            ssoText.toggleUpdateToast("OpenID")
        );
        cy.get(ssoEeSelector.nameInput).should("have.value", ssoEeText.testName);
        cy.get(ssoEeSelector.clientIdInput).should(
            "have.value",
            ssoEeText.testclientId
        );
        cy.get(ssoEeSelector.clientSecretInput).should(
            "have.value",
            ssoEeText.testclientSecret
        );
        cy.get(ssoEeSelector.WellKnownUrlInput).should(
            "have.value",
            ssoEeText.testWellknownUrl
        );
        cy.apiLogout();
        cy.visit("/login/my-workspace");

        cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
            "have.text",
            "Sign in with Tooljet OIDC"
        );
    });
});

