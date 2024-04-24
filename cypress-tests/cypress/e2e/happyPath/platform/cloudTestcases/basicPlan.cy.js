import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    verifyTooltip,
    navigateToManageSSO,
    navigateToManageGroups,
} from "Support/utils/common";
import { addNewUser, openInstanceSettings } from "Support/utils/eeCommon";

import { licenseText } from "Texts/license";
import { licenseSelectors, cloudLicesningSelector } from "Selectors/license";
import { groupsSelector } from "Selectors/manageGroups";
import { verifyTooltipDisabled, updateLicense } from "Support/utils/eeCommon";
import {
    verifyrenewPlanModal,
    verifyExpiredLicenseBanner,
} from "Support/utils/license";
import { selectAndAddDataSource } from "Support/utils/postgreSql";
import {
    whiteLabellingSelectors,
    commonEeSelectors,
    multiEnvSelector,
    eeGroupsSelector,
} from "Selectors/eeCommon";
import { ssoEeSelector } from "Selectors/eeCommon";

describe("", () => {
    const data = {};

    it("Verify White labelling and Subscription page elements", () => {
        cy.defaultWorkspaceLogin();
        openInstanceSettings();
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Settings");
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " White labelling"
        );

        cy.get(whiteLabellingSelectors.whiteLabelList)
            .verifyVisibleElement("have.text", "White labelling")
            .click();
        cy.get(commonEeSelectors.cardTitle).verifyVisibleElement(
            "have.text",
            "White labelling"
        );
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get(whiteLabellingSelectors.appLogoLabel).verifyVisibleElement(
            "have.text",
            "App Logo"
        );
        cy.get(whiteLabellingSelectors.appLogoInput).verifyVisibleElement(
            "have.attr",
            "value",
            "https://app.tooljet.com/logo.svg"
        );
        cy.get(whiteLabellingSelectors.appLogoInput).should("be.disabled");
        cy.get(whiteLabellingSelectors.appLogoHelpText).verifyVisibleElement(
            "have.text",
            "This will be used for branding across the app. Required dimensions of the logo- width 130px & height 26px"
        );
        cy.get(whiteLabellingSelectors.pageTitleLabel).verifyVisibleElement(
            "have.text",
            "Page Title"
        );
        cy.get(whiteLabellingSelectors.pageTitleInput).verifyVisibleElement(
            "have.attr",
            "value",
            "ToolJet"
        );
        cy.get(whiteLabellingSelectors.pageTitleInput).should("be.disabled");
        cy.get(whiteLabellingSelectors.pageTitleHelpText).verifyVisibleElement(
            "have.text",
            "This will be displayed as the browser page title"
        );
        cy.get(whiteLabellingSelectors.favIconLabel).verifyVisibleElement(
            "have.text",
            "Favicon"
        );
        cy.get(whiteLabellingSelectors.favIconInput).should("be.disabled");
        cy.get(whiteLabellingSelectors.favIconInput).verifyVisibleElement(
            "have.attr",
            "value",
            "https://app.tooljet.com/favico.png"
        );
        cy.get(whiteLabellingSelectors.favIconHelpText).verifyVisibleElement(
            "have.text",
            "This will be displayed in the address bar of the browser. Required dimensions of the logo- 16x16px or 32x32px"
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonSelectors.saveButton).verifyVisibleElement(
            "have.text",
            "Save changes"
        );
        cy.get(commonSelectors.saveButton).should("be.disabled");

        cy.get(cloudLicesningSelector.subscriptionListItem)
            .verifyVisibleElement("have.text", "Subscription")
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Subscription"
        );

        cy.get('[data-cy="subscription-overview"]').verifyVisibleElement(
            "have.text",
            "Subscription overview"
        );

        cy.get('[data-cy="license-type-label"]').verifyVisibleElement(
            "have.text",
            "Basic plan"
        );

        cy.verifyLabel("SUBSCRIPTION LIMITS");
        cy.get(licenseSelectors.noOfAppsLabel).verifyVisibleElement(
            "have.text",
            "Apps"
        );
        cy.get(licenseSelectors.noOfAppsfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );
        cy.get(licenseSelectors.noOfTotalUsersLabel).verifyVisibleElement(
            "have.text",
            "Total users"
        );
        cy.get(licenseSelectors.noOfBuildersLabel).verifyVisibleElement(
            "have.text",
            "Builders"
        );
        cy.get(licenseSelectors.noOfBuildersfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );
        cy.get(licenseSelectors.noOfEndUsersLabel).verifyVisibleElement(
            "have.text",
            "End users"
        );
        cy.get(licenseSelectors.noOfEndUsersfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );
        cy.get(licenseSelectors.noOfTablesLabel).verifyVisibleElement(
            "have.text",
            "Tables"
        );
        cy.get(licenseSelectors.noOfTablesfield).verifyVisibleElement(
            "have.value",
            "0/5"
        );

        cy.verifyLabel("FEATURE ACCESS");
        cy.verifyLabel("Open ID Connect");
        cy.verifyLabel("Audit logs");
        cy.verifyLabel("LDAP");
        cy.verifyLabel("SAML");
        cy.verifyLabel("Custom styles");
        cy.verifyLabel("Multi-Environment");
        cy.verifyLabel("Multiplayer editing");
        cy.verifyLabel("GitSync");

        cy.get('[data-cy="upgrade-button"]')
            .eq(0)
            .verifyVisibleElement("have.text", "Upgrade")
            .click();
        cy.get('[data-cy="modal-title"]').verifyVisibleElement(
            "have.text",
            "Upgrade"
        );

        cy.verifyLabel("Plan type");
        cy.verifyLabel("Business plan");

        cy.get(cloudLicesningSelector.builderUserLabel).verifyVisibleElement(
            "have.text",
            "No. of builders"
        );
        cy.get(cloudLicesningSelector.builderUserCostLabel).verifyVisibleElement(
            "have.text",
            "$24/month"
        );
        cy.get(cloudLicesningSelector.builderUserInput).verifyVisibleElement(
            "have.value",
            "1"
        );
        cy.get(cloudLicesningSelector.endUserLabel).verifyVisibleElement(
            "have.text",
            "No. of end users"
        );
        cy.get(cloudLicesningSelector.endUserCostLabel).verifyVisibleElement(
            "have.text",
            "$8/month"
        );
        cy.get(cloudLicesningSelector.endUserInput).verifyVisibleElement(
            "have.value",
            "1"
        );
        cy.verifyLabel("Promo code");
        cy.get(cloudLicesningSelector.promoCodeInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Enter promo code"
        );
        cy.get(cloudLicesningSelector.offerToggle).should("be.visible");
        cy.get(cloudLicesningSelector.offerToggleLabel)
            .eq(0)
            .verifyVisibleElement(
                "have.text",
                "Pay yearly You saved $96 by opting for the yearly plan!"
            );
        cy.get(cloudLicesningSelector.totalCostValue).verifyVisibleElement(
            "have.text",
            "$384.00/year"
        );
        cy.get('[data-cy="remaining-amount"]').verifyVisibleElement(
            "have.text",
            "$384.00"
        );
        cy.verifyLabel("Due today");
        cy.get(cloudLicesningSelector.contactUsHelper).verifyVisibleElement(
            "have.text",
            "Want a custom plan tailored to your needs? Contact us at hello@tooljet.com"
        );
        cy.get('[data-cy="modal-upgrade-button"]').verifyVisibleElement(
            "have.text",
            "Upgrade"
        );

        cy.get(cloudLicesningSelector.offerToggle).uncheck();
        cy.get(cloudLicesningSelector.builderUserCostLabel).verifyVisibleElement(
            "have.text",
            "$30/month"
        );
        cy.get(cloudLicesningSelector.endUserCostLabel).verifyVisibleElement(
            "have.text",
            "$10/month"
        );
        cy.get(cloudLicesningSelector.totalCostValue).verifyVisibleElement(
            "have.text",
            "$40/month"
        );

        cy.clearAndType(cloudLicesningSelector.builderUserInput, 15);
        cy.clearAndType(cloudLicesningSelector.endUserInput, 500);
        cy.get(cloudLicesningSelector.totalCostValue).verifyVisibleElement(
            "have.text",
            "$5450/month"
        );

        cy.get(cloudLicesningSelector.offerToggle).check();
        cy.get(cloudLicesningSelector.offerToggleLabel).verifyVisibleElement(
            "have.text",
            "Pay yearly You saved $13080 by opting for the yearly plan!"
        );
        cy.get(cloudLicesningSelector.totalCostValue).verifyVisibleElement(
            "have.text",
            "$52320.00/year"
        );
        cy.get('[data-cy="modal-close-button"]').click();
    });
    it("Compare plans", () => {
        cy.defaultWorkspaceLogin();
        openInstanceSettings();
        cy.get('[data-cy="subscription-list-item"]').click();
        cy.verifyLabel("Compare plans");
        cy.get('[data-cy="basic-plan-header"]').verifyVisibleElement(
            "have.text",
            "Basic plan"
        );
        cy.get(' [data-cy="builder-price"]:eq(0)').should(($el) => {
            expect($el.contents().text().trim().replace(/\s+/g, " ")).to.eq(
                "$0 / month per builder"
            );
        });
        cy.get('[data-cy="plus-icon"]:eq(0)').verifyVisibleElement(
            "have.text",
            "+"
        );
        cy.get('[data-cy="end-user-price"]:eq(0)').should(($el) => {
            expect($el.contents().text().trim().replace(/\s+/g, " ")).to.eq(
                "$0 / month per end user"
            );
        });
        const basicPlan = [
            " Unlimited applications",
            " SSO (Google & Github)",
            " Community support",
            " Unlimited ToolJet tables and rows",
            " Multiplayer editing",
        ];

        for (let i = 0; i <= 4; i++) {
            cy.get(`[data-cy="basic-plan-${i}"]`).verifyVisibleElement(
                "have.text",
                basicPlan[`${i}`]
            );
        }
        cy.get('[data-cy="current-plan-button"]').verifyVisibleElement(
            "have.text",
            "Current plan"
        );
        cy.get('[data-cy="business-plan-header"]').verifyVisibleElement(
            "have.text",
            "Business plan"
        );
        cy.get('[data-cy="compare-plan-offer-toggle"]').should("be.visible");
        cy.get('[data-cy="compare-plan-offer-toggle-label"]').verifyVisibleElement(
            "have.text",
            "Yearly20% off"
        );
        cy.get(' [data-cy="builder-price"]:eq(1)').should(($el) => {
            expect($el.contents().text().trim().replace(/\s+/g, " ")).to.eq(
                "$24 / month per builder"
            );
        });
        cy.get('[data-cy="plus-icon"]:eq(1)').verifyVisibleElement(
            "have.text",
            "+"
        );
        cy.get('[data-cy="end-user-price"]:eq(1)').should(($el) => {
            expect($el.contents().text().trim().replace(/\s+/g, " ")).to.eq(
                "$8 / month per end user"
            );
        });
        cy.wait(500);
        cy.get('[data-cy="compare-plan-offer-toggle"]').uncheck();
        cy.get('[data-cy="compare-plan-offer-toggle-label"]').verifyVisibleElement(
            "have.text",
            "Monthly20% off"
        );
        cy.get(' [data-cy="builder-price"]:eq(1)').should(($el) => {
            expect($el.contents().text().trim().replace(/\s+/g, " ")).to.eq(
                "$30 / month per builder"
            );
        });
        cy.get('[data-cy="end-user-price"]:eq(1)').should(($el) => {
            expect($el.contents().text().trim().replace(/\s+/g, " ")).to.eq(
                "$10 / month per end user"
            );
        });

        const businessPlan = [
            " Multi-instance deployments",
            " SSO (Okta, Google, OpenID Connect & more)",
            " Granular access control",
            " Unlimited users",
            " Custom branding/white labelling",
            " Audit logging",
            " Unlimited ToolJet tables and rows",
            " Multiple environments",
            " Air-gapped deployment",
            " Priority support via email",
        ];

        for (let i = 0; i <= 9; i++) {
            cy.get(`[data-cy="business-plan-${i}"]`).verifyVisibleElement(
                "have.text",
                businessPlan[`${i}`]
            );
        }
        cy.get('[data-cy="upgrade-button"]:eq(1)').verifyVisibleElement(
            "have.text",
            "Upgrade"
        );

        cy.get('[data-cy="enterprise-header"]').verifyVisibleElement(
            "have.text",
            "Enterprise"
        );
        cy.get('[data-cy="custom-pricing-label"]').verifyVisibleElement(
            "have.text",
            "Custom pricing"
        );

        const enterprisePlan = [
            " All features of business plan",
            " Unlimited applications",
            " SSO (Google & Github)",
            " Community support",
            " Unlimited ToolJet tables and rows",
            " Multiplayer editing",
        ];

        for (let i = 0; i <= 5; i++) {
            cy.get(`[data-cy="enterprise-${i}"]`).verifyVisibleElement(
                "have.text",
                enterprisePlan[`${i}`]
            );
        }

        cy.get('[data-cy="schedule-a-call-button"]').verifyVisibleElement(
            "have.text",
            "Schedule a call"
        );
    });
    it("Verify basic plan features and banners", () => {
        data.appName = `${fake.companyName}-App`;
        data.ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        cy.defaultWorkspaceLogin();

        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get(cloudLicesningSelector.warningTextHeader).verifyVisibleElement(
            "have.text",
            "Start your 14-day free trial! "
        );
        cy.get(licenseSelectors.warningInfoText).verifyVisibleElement(
            "have.text",
            "Explore advanced features while enjoying this workspace's free trial."
        );
        cy.get(cloudLicesningSelector.upgradeLink).verifyVisibleElement(
            "have.text",
            "Start free trial"
        );

        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.get(commonSelectors.releaseButton).verifyVisibleElement(
            "have.text",
            "Release"
        );
        cy.apiDeleteApp();

        cy.visit("my-workspace/data-sources");
        selectAndAddDataSource("databases", "PostgreSQL", data.ds);
        cy.wait(1000);
        verifyTooltipDisabled(
            multiEnvSelector.stagingLabel,
            "Multi-environments are available only in paid plans"
        );
        verifyTooltipDisabled(
            multiEnvSelector.productionLabel,
            "Multi-environments are available only in paid plans"
        );

        navigateToManageGroups();

        cy.get('[data-cy="create-new-group-button"]').should("be.disabled");
        cy.get(cloudLicesningSelector.warningTextHeader).verifyVisibleElement(
            "have.text",
            "Custom groups & permissions are available in our paid plans. For more, Start free trial"
        );

        cy.get(groupsSelector.permissionsLink).click();
        cy.get(licenseSelectors.lockGradientIcon).should("be.visible");
        cy.get(groupsSelector.appsCreateCheck).verifyVisibleElement("be.disabled");
        cy.get(groupsSelector.appsDeleteCheck).verifyVisibleElement("be.disabled");
        cy.get(groupsSelector.foldersCreateCheck).verifyVisibleElement(
            "be.disabled"
        );
        cy.get(groupsSelector.workspaceVarCheckbox).verifyVisibleElement(
            "be.disabled"
        );

        cy.get(eeGroupsSelector.datasourceLink).click();
        cy.get(licenseSelectors.dsGradientIcon).should("be.visible");
        cy.get(commonSelectors.settingsIcon).click();

        verifyTooltip(
            commonEeSelectors.auditLogIcon,
            "Audit logs are available only in paid plans"
        );
        verifyTooltipDisabled(
            groupsSelector.createNewGroupButton,
            "Custom groups can only be created in paid plans"
        );
        navigateToManageSSO();
        verifyTooltipDisabled(
            ssoEeSelector.oidc,
            "OpenID Connect is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            '[data-cy="ldap-sso-card"]',
            "LDAP is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            '[data-cy="saml-sso-card"]',
            "SAML is available only\n        in paid plans"
        );

        cy.get(commonSelectors.listItem("Custom styles")).click();
        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get(commonSelectors.saveButton).verifyVisibleElement("be.disabled");

        cy.get('[data-cy="configure-git-list-item"]').click();
        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
    });
});
