import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    verifyTooltip,
    navigateToManageSSO,
    navigateToManageGroups,
} from "Support/utils/common";
import { addNewUser } from "Support/utils/eeCommon";

import { licenseText } from "Texts/license";
import { licenseSelectors, cloudLicesningSelector } from "Selectors/license";
import { groupsSelector } from "Selectors/manageGroups";
import {
    verifyTooltipDisabled,
    updateLicense,
    openInstanceSettings,
} from "Support/utils/eeCommon";
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
import { AddNewconstants } from "Support/utils/workspaceConstants";
import { userSignUp } from "Support/utils/onboarding";

describe("", () => {
    const data = {};

    it("Verify basic plan features and banners for super-admin user", () => {
        data.appName = `${fake.companyName}-App`;
        data.ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        cy.defaultWorkspaceLogin();

        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
            "have.text",
            "Try ToolJet's premium features now! "
        );
        cy.get(licenseSelectors.warningInfoText).verifyVisibleElement(
            "have.text",
            "Upgrade to a paid plan to try out our premium features and build better apps faster"
        );
        cy.get('[data-cy="start-free-trial-button"]').verifyVisibleElement(
            "have.text",
            "Start free trial"
        );

        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.waitForAppLoad();
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
        cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
            "have.text",
            "Custom groups & permissions are available in our paid plans. Upgrade"
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

        verifyTooltipDisabled(
            groupsSelector.createNewGroupButton,
            "Custom groups can only be created in paid plans"
        );

        cy.get(commonSelectors.settingsIcon).click();
        verifyTooltip(
            commonEeSelectors.auditLogIcon,
            "Audit logs are available only in paid plans"
        );

        cy.get(commonSelectors.manageSSOOption).click();
        verifyTooltipDisabled(
            commonSelectors.listItem("OpenID Connect"),
            "OpenID Connect is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            commonSelectors.listItem("LDAP"),
            "LDAP is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            commonSelectors.listItem("SAML"),
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

        cy.get(commonSelectors.workspaceConstantsIcon).click();
        AddNewconstants(data.constantsName, data.constantsName);

        cy.wait(3000);
        verifyTooltip(
            '[data-cy="-list-item"]:eq(2)',
            "Multi-environments are available only in paid plans"
        );
        verifyTooltip(
            '[data-cy="-list-item"]:eq(1)',
            "Multi-environments are available only in paid plans"
        );
    });

    it("Verify basic plan features and banners for admin user", () => {
        data.appName = `${fake.companyName}-App`;
        data.ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase();
        data.workspaceName = fake.lastName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        userSignUp(data.firstName, data.email, data.workspaceName);
        cy.wait(3000);

        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
            "have.text",
            "Try ToolJet's premium features now! "
        );
        cy.get(licenseSelectors.warningInfoText).verifyVisibleElement(
            "have.text",
            "Contact your super admin to upgrade ToolJet from the free plan to a paid plan"
        );
        cy.skipWalkthrough();
        cy.createApp(data.appName);
        cy.get(commonSelectors.releaseButton).verifyVisibleElement(
            "have.text",
            "Release"
        );
        cy.backToApps();

        cy.get('[data-cy="icon-global-datasources"]').click();
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
        cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
            "have.text",
            "Custom groups & permissions are available in our paid plans. Contact superadmin for more"
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

        verifyTooltipDisabled(
            groupsSelector.createNewGroupButton,
            "Custom groups can only be created in paid plans"
        );

        cy.get(commonSelectors.settingsIcon).click();
        verifyTooltip(
            commonEeSelectors.auditLogIcon,
            "Audit logs are available only in paid plans"
        );

        cy.get(commonSelectors.manageSSOOption).click();
        verifyTooltipDisabled(
            commonSelectors.listItem("OpenID Connect"),
            "OpenID Connect is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            commonSelectors.listItem("LDAP"),
            "LDAP is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            commonSelectors.listItem("SAML"),
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

        cy.get(commonSelectors.workspaceConstantsIcon).click();
        AddNewconstants(data.constantsName, data.constantsName);

        cy.wait(3000);
        verifyTooltip(
            '[data-cy="-list-item"]:eq(2)',
            "Multi-environments are available only in paid plans"
        );
        verifyTooltip(
            '[data-cy="-list-item"]:eq(1)',
            "Multi-environments are available only in paid plans"
        );
    });
});
