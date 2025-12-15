import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import {
    InstanceSSO,
    instanceSSOConfig,
    openInstanceSettings,
    passwordToggle,
    resetInstanceDomain,
    updateAutoSSOToggle,
} from "Support/utils/platform/eeCommon";

import * as SSO from "Support/utils/manageSSO";

describe("Instance login", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        instanceSSOConfig();
        passwordToggle(true);
        updateAutoSSOToggle();
        cy.apiUpdateLicense();
    });

    it("Should verify instance login settings page elements and their functionality", () => {
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
        SSO.loginSettingPageElements("instance");
        SSO.verifyLoginSettings("instance");
    });

    it("Should verify Google SSO modal elements and their functionality", () => {
        instanceSSOConfig(false);
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();
        SSO.googleSSOPageElements("instance");
    });

    it("Should verify Git SSO modal elements and their functionality", () => {
        instanceSSOConfig(false);
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();
        SSO.gitSSOPageElements("instance");
    });

    it("Should verify openID modal elements and their functionality", () => {
        instanceSSOConfig(false);
        openInstanceSettings();
        cy.get(ssoSelector.instanceLoginListItem).click();
        SSO.oidcSSOPageElements("instance");
    });
});
