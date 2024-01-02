import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { verifyTooltip, navigateToManageSSO } from "Support/utils/common";
import { addNewUser } from "Support/utils/eeCommon";
import {
    commonEeSelectors,
    instanceSettingsSelector,
} from "Selectors/eeCommon";
import { licenseText } from "Texts/license";
import { licenseSelectors } from "Selectors/license";
import { groupsSelector } from "Selectors/manageGroups";
import { verifyTooltipDisabled } from "Support/utils/eeCommon";
import {
    verifyrenewPlanModal,
    verifyExpiredLicenseBanner,
} from "Support/utils/license";
import { selectAndAddDataSource } from "Support/utils/postgreSql";

describe("", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });
    it("should verify license page elements", () => {
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
        cy.get('[data-cy="access-tab-title"]').verifyVisibleElement(
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
    it("should verify banners, renew modal and tooltips for expired license", () => {
        let ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

        cy.get(commonEeSelectors.instanceSettingIcon).click();
        cy.get(licenseSelectors.licenseOption).click();
        cy.get(licenseSelectors.licenseKeyOption).click();
        cy.clearAndType(
            licenseSelectors.licenseTextArea,
            "RAtrm9cnHYAJPNpDuTig+lTw9Mt8VnlflE/ohBJoF4jMVjKhi6OOJwh6aSPyDLpehIpNrffXWj+7MJmzliJWYWc5PTND2tHtsBn4deSS2nwh6+vSeWx21kCDj45esdIcRlPSdeYxfXw6JmuDe0LRDYy+SnMFAeXjyttBdGglgxSpd1givIidR2aIw61l2YabXHzId+WLD9d0JXAt5yXa6inWDjZ9VwBwiUsCE2IkY013lkJgntcIwqwjuOA9A+vJL6DRvYF+F4UlfvoQocSaikwJAJZZW9mY1SMdIP2cKWSsoshXCiK2rtTy48fDMha/iBrVm9QsW03mp/98FtWZxZwglvg8CE7Pqu+k8YbTCLusZdg9pNih/SuW8lyWvn2bn9ZJZAZbcU33SuCLkC1dCPBajL+dzfEiha3rqi5YNbe0nNbKJuFTHmcuhoMVKyoJvJYvh3yDezwlcfffbH7aIlmAY943QrsJMQw/M9JkWCz+Pq8ULwjQEI7NE55QUpX6FZR7BzllCbeK1jjbZz7b9jTOHIAfF4Ia+mNXm7yW1bWS/mZ0pwOgsMXv9o3PkwCBtd5U7ySac8d5X1YbTHZeOgD6LaBLiuFerGyPPM55h5+kJVaqgvclbfkhx0IfpMUilT7bD/0FwH3b8miHl0K/knzWorqrSyskKHg6vdFru/g="
        );
        cy.get(licenseSelectors.updateButton).click();
        cy.intercept("GET", "http://localhost:3000/api/license").as("wait");
        cy.wait("@wait");
        cy.get(licenseSelectors.expiryStatus).verifyVisibleElement(
            "have.text",
            "License Expired"
        );
        cy.wait(2000);

        cy.get('[data-cy="enterprise-gradient-icon"]').should("be.visible");
        cy.get('[data-cy="warning-text-header"] > div').verifyVisibleElement(
            "have.text",
            "Your license has expired! Renew"
        );
        cy.get('[data-cy="renew-button"]')
            .verifyVisibleElement("have.text", "Renew")
            .click();
        cy.wait(3000);
        cy.get('[data-cy="copy-icon"]').should("be.visible").click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Copied to clipboard!");

        verifyrenewPlanModal();

        cy.get(instanceSettingsSelector.manageInstanceSettings).click();
        cy.get('[data-cy="enterprise-gradient-icon"]:eq(1)').should("be.visible");
        cy.get('[data-cy="paid-feature-button"]').verifyVisibleElement(
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
        cy.get('[data-cy="paid-feature-button"]').verifyVisibleElement(
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

        cy.get(commonSelectors.globalDataSourceIcon).click();
        selectAndAddDataSource("databases", "PostgreSQL", ds);
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

        cy.get(commonSelectors.workspaceSettingsIcon).click();
        cy.get(commonSelectors.manageGroupsOption).click();

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
        cy.get('[data-cy="lock-gradient"]').should("be.visible");
        cy.get(groupsSelector.appsCreateCheck).verifyVisibleElement("be.disabled");
        cy.get(groupsSelector.appsDeleteCheck).verifyVisibleElement("be.disabled");
        cy.get(groupsSelector.foldersCreateCheck).verifyVisibleElement(
            "be.disabled"
        );
        cy.get(groupsSelector.workspaceVarCheckbox).verifyVisibleElement(
            "be.disabled"
        );

        cy.get('[data-cy="datasource-link"]').click();
        cy.get('[data-cy="datasource-gradient"]').should("be.visible");

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
            '[data-cy="openid-connect-list-item"]',
            "OpenID Connect is available only\n        in paid plans"
        );
        verifyTooltipDisabled(
            '[data-cy="ldap-list-item"]',
            "LDAP is available only\n        in paid plans"
        );
        verifyTooltipDisabled(
            '[data-cy="saml-list-item"]',
            "SAML is available only\n        in paid plans"
        );

        cy.get('[data-cy="custom-styles-list-item"]').click();
        cy.get('[data-cy="enterprise-gradient-icon"]:eq(1)').should("be.visible");
        cy.get('[data-cy="paid-feature-button"]').verifyVisibleElement(
            "have.text",
            "Paid feature"
        );
        cy.get('[data-cy="save-button"]').verifyVisibleElement("be.disabled");
    });
});
