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
} from "Support/utils/eeCommon";
import { commonEeSelectors, ssoEeSelector } from "Selectors/eeCommon";
import { commonEeText, ssoEeText } from "Texts/eeCommon";

describe("Instance login", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        instanceSSOConfig();
    });
    it("Should verify instance login page elements", () => {
        InstanceSSO(false, false, false);
        resetInstanceDomain(false);
        cy.reload();
        openInstanceSettings();
        cy.get('[data-cy="instance-login-list-item"]').click();

        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Settings");
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Instance login"
        );

        cy.get(ssoSelector.cardTitle).verifyVisibleElement(
            "have.text",
            "Instance login"
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

        verifyTooltipDisabled(
            ssoSelector.enableSignUpToggle,
            "Enable personal workspace to enable sign up"
        );
        allowPersonalWorkspace();
        cy.reload();

        cy.get(ssoSelector.enableSignUpToggle).check();
        cy.get(ssoSelector.cancelButton).click();
        cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");
        cy.get(ssoSelector.enableSignUpToggle).check();
        cy.get(ssoSelector.saveButton).click();
        cy.get(ssoSelector.enableSignUpToggle).should("be.checked");

        cy.get(ssoSelector.enableSignUpToggle).uncheck();
        cy.get(ssoSelector.saveButton).click();
        cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");

        cy.get('[data-cy="google-label"]').verifyVisibleElement(
            "have.text",
            "Google"
        );
        cy.get('[data-cy="github-label"]').verifyVisibleElement(
            "have.text",
            "GitHub"
        );
        cy.get('[data-cy="openid-connect-label"]').verifyVisibleElement(
            "have.text",
            "OpenID Connect"
        );

        cy.clearAndType(ssoSelector.allowedDomainInput, ssoText.allowedDomain);
        cy.get(ssoSelector.saveButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Instance settings have been updated"
        );

        cy.get(ssoSelector.passwordEnableToggle).uncheck();
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            "Please ensure SSO is configured successfully before disabling password login or else you will get locked out. Are you sure you want to continue?"
        );
        cy.get('[data-cy="superadmin-info-text"]').verifyVisibleElement(
            "have.text",
            "Super admin can still access their account via http://localhost:8082/login/super-admin"
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

        instanceSSOConfig(false);
        cy.reload();
        cy.get(ssoSelector.passwordEnableToggle).should("be.disabled");

        verifyTooltipDisabled(
            ssoSelector.passwordEnableToggle,
            "Password login cannot be disabled unless SSO is configured"
        );
    });
    it("Should verify Google SSO modal elements", () => {
        openInstanceSettings();
        cy.get('[data-cy="instance-login-list-item"]').click();

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

        cy.logoutApi();
        cy.visit("/login/my-workspace");
        cy.get(ssoSelector.googleIcon).should("be.visible");
        cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
            "have.text",
            ssoText.googleSSOText
        );
    });
    it("Should verify Git SSO modal elements", () => {
        openInstanceSettings();
        cy.get('[data-cy="instance-login-list-item"]').click();

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

        cy.logoutApi();
        cy.visit("/login/my-workspace");

        cy.get(ssoSelector.gitIcon).should("be.visible");
        cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
            "have.text",
            ssoText.gitSignInText
        );
    });
    it("Should verify openID modal elements", () => {
        openInstanceSettings();
        cy.get('[data-cy="instance-login-list-item"]').click();

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
        cy.get(ssoSelector.statusLabel).verifyVisibleElement(
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
        cy.logoutApi();
        cy.visit("/login/my-workspace");

        cy.get(ssoEeSelector.oidcSSOText).verifyVisibleElement(
            "have.text",
            "Sign in with Tooljet OIDC"
        );
    });
});
