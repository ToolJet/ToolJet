import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import {
    verifyTooltip,
    navigateToManageSSO,
    navigateToManageGroups,
} from "Support/utils/common";
import { addNewUser } from "Support/utils/eeCommon";
import {
    commonEeSelectors,
    instanceSettingsSelector,
    multiEnvSelector,
} from "Selectors/eeCommon";
import { licenseText } from "Texts/license";
import { licenseSelectors } from "Selectors/license";
import { groupsSelector } from "Selectors/manageGroups";
import { verifyTooltipDisabled, updateLicense } from "Support/utils/eeCommon";
import {
    verifyrenewPlanModal,
    verifyExpiredLicenseBanner,
    adminExpiredLicenseBanner,
} from "Support/utils/license";
import { selectAndAddDataSource } from "Support/utils/postgreSql";
import { AddNewconstants } from "Support/utils/workspaceConstants";
import { addQuery, selectDatasource } from "Support/utils/dataSource";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { dataSourceSelector } from "Selectors/dataSource";
import { editAndVerifyWidgetName } from "Support/utils/commonWidget";
import { appPromote, releaseApp } from "Support/utils/multiEnv";

describe("", () => {
    const data = {};

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });
    after(() => {
        updateLicense(Cypress.env("license-key"));
    });
    it("Should verify license page elements", () => {
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonEeSelectors.instanceSettingIcon).click();
        cy.get(licenseSelectors.licenseOption).click();

        cy.get(licenseSelectors.licenseOption).verifyVisibleElement(
            "have.text",
            licenseText.license
        );
        cy.get(licenseSelectors.licenseKeyOption).verifyVisibleElement(
            "have.text",
            licenseText.licenseKey
        );
        cy.get(licenseSelectors.limitOption).verifyVisibleElement(
            "have.text",
            licenseText.limitOption
        );
        cy.get(licenseSelectors.accessOption).verifyVisibleElement(
            "have.text",
            licenseText.accessOption
        );
        cy.get(licenseSelectors.domainOption).verifyVisibleElement(
            "have.text",
            licenseText.domainOption
        );

        cy.get(licenseSelectors.licenseKeyOption).verifyVisibleElement(
            "have.text",
            licenseText.licenseKey
        );
        cy.get(licenseSelectors.expiryStatus).verifyVisibleElement(
            "have.text",
            "Valid till 20 Jun 2055 (UTC)"
        );
        cy.get(licenseSelectors.licenseLabel).verifyVisibleElement(
            "have.text",
            licenseText.license
        );
        cy.get(licenseSelectors.licenseTextArea).should("be.visible");
        cy.get(licenseSelectors.updateButton).verifyVisibleElement(
            "have.text",
            licenseText.updateButton
        );

        cy.get(licenseSelectors.limitOption).click();
        cy.get(licenseSelectors.limitsTabTitle).verifyVisibleElement(
            "have.text",
            licenseText.limitsTabTitle
        );
        cy.get(licenseSelectors.expiryStatus).verifyVisibleElement(
            "have.text",
            "Valid till 20 Jun 2055 (UTC)"
        );

        cy.get(licenseSelectors.appsTab).verifyVisibleElement(
            "have.text",
            licenseText.appsTab
        );
        cy.get(licenseSelectors.noOfAppsLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfAppsLabel
        );
        cy.get(licenseSelectors.noOfAppsfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );

        cy.get(licenseSelectors.workspaceTab)
            .verifyVisibleElement("have.text", licenseText.workspaceTab)
            .click();
        cy.get(licenseSelectors.noOfworkspaceLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfworkspaceLabel
        );
        cy.get(licenseSelectors.noOfWorkspacefield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );

        cy.get(licenseSelectors.usersTab)
            .verifyVisibleElement("have.text", licenseText.usersTab)
            .click();
        cy.get(licenseSelectors.noOfTotalUsersLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfTotalUsersLabel
        );
        cy.get(licenseSelectors.noOfBuildersLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfBuildersLabel
        );
        cy.get(licenseSelectors.noOfBuildersfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );
        cy.get(licenseSelectors.noOfEndUsersLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfEndUsersLabel
        );
        cy.get(licenseSelectors.noOfEndUsersfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );
        cy.get(licenseSelectors.noOfSuperAdminLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfSuperAdminLabel
        );
        cy.get(licenseSelectors.noOfSuperAdminfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );

        cy.get(licenseSelectors.tablesTab)
            .verifyVisibleElement("have.text", licenseText.tablesTab)
            .click();
        cy.get(licenseSelectors.noOfTablesLabel).verifyVisibleElement(
            "have.text",
            licenseText.noOfTablesLabel
        );
        cy.get(licenseSelectors.noOfTablesfield).verifyVisibleElement(
            "have.value",
            "Unlimited"
        );
        // =>Icon validation.

        cy.get(licenseSelectors.accessOption).click();
        cy.get(licenseSelectors.accessTabTitle).verifyVisibleElement(
            "have.text",
            "Access"
        );
        cy.get('[data-cy="open-id-connect-label"]').verifyVisibleElement(
            "have.text",
            "Open ID Connect"
        );
        cy.get('[data-cy="audit-logs-label"]').verifyVisibleElement(
            "have.text",
            "Audit Logs"
        );
        cy.get('[data-cy="ldap-label"]').verifyVisibleElement("have.text", "LDAP");
        cy.get('[data-cy="saml-label"]').verifyVisibleElement("have.text", "SAML");
        cy.get('[data-cy="custom-styles-label"]').verifyVisibleElement(
            "have.text",
            "Custom styles"
        );
        cy.get('[data-cy="multi-environment-label"]').verifyVisibleElement(
            "have.text",
            "Multi-Environment"
        );

        cy.get(licenseSelectors.domainOption).click();
        cy.get('[data-cy="domain-tab-title"]').verifyVisibleElement(
            "have.text",
            "Domain"
        );
        cy.get('[data-cy="no-domain-header"]').verifyVisibleElement(
            "have.text",
            "No Domain Linked"
        );
        cy.get('[data-cy="no-domain-info-text"]').verifyVisibleElement(
            "have.text",
            "Please contact ToolJet team to link your domain"
        );
    });
    it("Should verify expired license banners, renew modal and tooltips for super-admin user", () => {
        let ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.appName = `${fake.companyName} App`;
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonEeSelectors.instanceSettingIcon).click();
        cy.get(licenseSelectors.licenseOption).click();
        cy.get(licenseSelectors.licenseKeyOption).click();
        cy.clearAndType(
            licenseSelectors.licenseTextArea,
            Cypress.env("expired-license-key")
        );
        cy.get(licenseSelectors.updateButton).click();
        cy.intercept("GET", "http://localhost:3000/api/license").as("wait");
        cy.wait("@wait");
        cy.get(licenseSelectors.expiryStatus).verifyVisibleElement(
            "have.text",
            "License Expired"
        );
        cy.wait(2000);

        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
            "have.text",
            "Your license has expired! Renew"
        );
        cy.get('[data-cy="renew-button"]')
            .verifyVisibleElement("have.text", "Renew")
            .click();
        cy.wait(3000);
        cy.get('[data-cy="copy-icon"]').should("be.visible").realClick();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Copied to clipboard!");

        verifyrenewPlanModal();

        cy.get(instanceSettingsSelector.manageInstanceSettings).click();
        cy.get('[data-cy="enterprise-gradient-icon"]:eq(1)').should("be.visible");
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get(instanceSettingsSelector.allowWorkspaceToggle)
            .eq(0)
            .should("be.disabled");
        cy.get(instanceSettingsSelector.allowWorkspaceToggle)
            .eq(1)
            .should("be.disabled");
        cy.get(instanceSettingsSelector.allowWorkspaceToggle)
            .eq(2)
            .should("be.disabled");

        cy.get('[data-cy="white-labelling-list-item"]').click();
        cy.get('[data-cy="enterprise-gradient-icon"]:eq(1)').should("be.visible");
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get('[data-cy="input-field-app-logo"]').should("be.disabled");
        cy.get('[data-cy="input-field-page-title"]').should("be.disabled");
        cy.get('[data-cy="input-field-fav-icon"]').should("be.disabled");
        cy.get('[data-cy="save-button"]').should("be.disabled");

        cy.get(commonSelectors.dashboardIcon).click();
        cy.wait(2000);
        verifyExpiredLicenseBanner();
        verifyrenewPlanModal();
        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.waitForAppLoad();
        cy.get(commonSelectors.releaseButton).verifyVisibleElement(
            "have.text",
            "Release"
        );
        cy.apiDeleteApp();

        cy.visit("my-workspace/data-sources");

        selectAndAddDataSource("databases", "PostgreSQL", ds);
        cy.wait(1000);
        verifyTooltipDisabled(
            '[data-cy="staging-label"]',
            "Multi-environments are available only in paid plans"
        );
        verifyTooltipDisabled(
            '[data-cy="production-label"]',
            "Multi-environments are available only in paid plans"
        );

        cy.get('[data-cy="icon-workflows"]').click();
        cy.wait(2000);
        verifyExpiredLicenseBanner();
        verifyrenewPlanModal();

        navigateToManageGroups();

        cy.get('[data-cy="create-new-group-button"]').should("be.disabled");
        cy.get('[data-cy="warning-text-header"]:eq(1)').verifyVisibleElement(
            "have.text",
            "Custom groups & permissions are available in our paid plans. Renew"
        );
        cy.get('[data-cy="renew-button"]:eq(1)')
            .verifyVisibleElement("have.text", "Renew")
            .click();
        verifyrenewPlanModal();

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

        cy.get('[data-cy="datasource-link"]').click();
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
        cy.get(commonSelectors.manageSSOOption).click();
        verifyTooltipDisabled(
            '[data-cy="openid-connect-list-item"]',
            "OpenID Connect is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            '[data-cy="ldap-list-item"]',
            "LDAP is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            '[data-cy="saml-list-item"]',
            "SAML is available only\n        in paid plans"
        );

        cy.get('[data-cy="custom-styles-list-item"]').click();
        cy.get('[data-cy="enterprise-gradient-icon"]:eq(1)').should("be.visible");
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get('[data-cy="save-button"]').verifyVisibleElement("be.disabled");
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
    it("Should verify expired license banners, renew modal and tooltips for admin user", () => {
        let ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.appName = `${fake.companyName} App`;
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.firstName = fake.firstName;
        data.workspaceName = data.firstName.toLowerCase();

        updateLicense(Cypress.env("expired-license-key"));
        cy.logoutApi();

        cy.apiLogin("test@tooljet.com", "password");
        cy.apiCreateWorkspace(data.firstName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);

        cy.get(commonSelectors.dashboardIcon).click();
        cy.wait(2000);
        adminExpiredLicenseBanner();

        cy.skipWalkthrough();
        cy.createApp(data.appName);
        cy.get(commonSelectors.releaseButton).verifyVisibleElement(
            "have.text",
            "Release"
        );

        cy.visit(`${data.workspaceName}/data-sources`);

        selectAndAddDataSource("databases", "PostgreSQL", ds);
        cy.wait(1000);
        verifyTooltipDisabled(
            '[data-cy="staging-label"]',
            "Multi-environments are available only in paid plans"
        );
        verifyTooltipDisabled(
            '[data-cy="production-label"]',
            "Multi-environments are available only in paid plans"
        );

        cy.get('[data-cy="icon-workflows"]').click();
        cy.wait(2000);
        adminExpiredLicenseBanner();

        navigateToManageGroups();

        cy.get('[data-cy="create-new-group-button"]').should("be.disabled");
        cy.get('[data-cy="warning-text-header"]:eq(1)').verifyVisibleElement(
            "have.text",
            "Custom groups & permissions are available in our paid plans. Contact superadmin for more"
        );
        cy.get(licenseSelectors.enterpriseGradientIcon).should("be.visible");
        cy.get('[data-cy="warning-text-header"] > div')
            .eq(0)
            .verifyVisibleElement(
                "have.text",
                "Your license has expired! Contact superadmin for more"
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

        cy.get('[data-cy="datasource-link"]').click();
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
        cy.get(commonSelectors.manageSSOOption).click();
        verifyTooltipDisabled(
            '[data-cy="openid-connect-list-item"]',
            "OpenID Connect is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            '[data-cy="ldap-list-item"]',
            "LDAP is available only\n        in paid plans"
        );
        cy.reload();
        verifyTooltipDisabled(
            '[data-cy="saml-list-item"]',
            "SAML is available only\n        in paid plans"
        );

        cy.get('[data-cy="custom-styles-list-item"]').click();
        cy.get('[data-cy="enterprise-gradient-icon"]:eq(1)').should("be.visible");
        cy.get(licenseSelectors.paidFeatureButton).verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get('[data-cy="save-button"]').verifyVisibleElement("be.disabled");
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
    it("Should verify happy-path flow for a valid to expired license", () => {
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.appName = `${fake.companyName}-App`;
        data.dsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.slug = `${fake.companyName.toLowerCase()}-app`;
        updateLicense(Cypress.env("license-key"));

        cy.apiLogin();
        cy.apiCreateGDS(
            "http://localhost:3000/api/v2/data_sources",
            data.dsName,
            "postgresql",
            [
                { key: "host", value: Cypress.env("pg_host") },
                { key: "port", value: 5432 },
                { key: "database", value: "" },
                { key: "username", value: "postgres" },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );
        cy.visit("/");
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        AddNewconstants(data.constantsName, "development_multi_env");
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );
        cy.wait(500);
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(2)').click();
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );
        AddNewconstants(data.constantsName, "staging_multi_env");
        cy.wait(500);
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(3)').click();
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );
        AddNewconstants(data.constantsName, "production_multi_env");

        cy.get(commonSelectors.globalDataSourceIcon).click();
        selectDatasource(data.dsName);
        cy.get('[data-cy="development-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(500);

        cy.get('[data-cy="staging-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(500);

        cy.get('[data-cy="production-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(500);

        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.waitForAppLoad();

        cy.wait(2000);
        addQuery("table_preview", `SELECT * FROM tooljet;`, data.dsName);
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(".custom-toggle-switch>.switch>").eq(3).click();
        cy.waitForAutoSave();
        cy.dragAndDropWidget("Text", 550, 650);
        editAndVerifyWidgetName(data.widgetName, []);
        cy.waitForAutoSave();

        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.table_preview.data[0].envname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");

        appPromote("development", "release");

        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.wait(1000);

        updateLicense(Cypress.env("expired-license-key"));
        cy.visitSlug({
            actualUrl: `http://localhost:8082/applications/${data.slug}`,
        });

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");

        updateLicense(Cypress.env("license-key"));
        cy.reload();
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "production");
    });
    it("Should verify happy-path flow for a basic to valid license", () => {
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.appName = `${fake.companyName}-App`;
        data.dsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.slug = `${fake.companyName.toLowerCase()}-app`;
        let currentVersion = "";
        let newVersion = [];
        let versionFrom = "";
        updateLicense(Cypress.env("expired-license-key"));
        cy.logoutApi();

        cy.apiLogin();
        cy.apiCreateGDS(
            "http://localhost:3000/api/v2/data_sources",
            data.dsName,
            "postgresql",
            [
                { key: "host", value: Cypress.env("pg_host") },
                { key: "port", value: 5432 },
                { key: "database", value: "" },
                { key: "username", value: "postgres" },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );
        cy.visit("/");
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        AddNewconstants(data.constantsName, "development_multi_env");
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );

        cy.get(commonSelectors.globalDataSourceIcon).click();
        selectDatasource(data.dsName);
        cy.get('[data-cy="development-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(500);

        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.waitForAppLoad();

        cy.wait(2000);
        addQuery("table_preview", `SELECT * FROM tooljet;`, data.dsName);
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(".custom-toggle-switch>.switch>").eq(3).click();
        cy.waitForAutoSave();
        cy.dragAndDropWidget("Text", 550, 650);
        editAndVerifyWidgetName(data.widgetName, []);
        cy.waitForAutoSave();

        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.table_preview.data[0].envname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");

        releaseApp();

        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.wait(1000);

        updateLicense(Cypress.env("license-key"));
        cy.visitSlug({
            actualUrl: `http://localhost:8082/applications/${data.slug}`,
        });

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");

        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(2000);

        cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
            "have.text",
            "Production"
        );
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");

        cy.get(multiEnvSelector.currentEnvName).click();
        cy.get(multiEnvSelector.envNameList).eq(1).click();

        cy.wait(2000);
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");

        cy.get(multiEnvSelector.currentEnvName).click();
        cy.get(multiEnvSelector.envNameList).eq(0).click();

        cy.wait(2000);
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "development");
    });

});
