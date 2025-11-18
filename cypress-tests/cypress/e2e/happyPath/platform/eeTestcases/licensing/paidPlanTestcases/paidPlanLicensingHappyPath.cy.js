import { commonSelectors } from "Selectors/common";
import {
  commonEeSelectors,
  instanceSettingsSelector,
  whiteLabellingSelectors,
} from "Selectors/eeCommon";
import { licenseSelectors } from "Selectors/license";
import { groupsSelector } from "Selectors/manageGroups";
import { usersSelector } from "Selectors/manageUsers";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import * as common from "Support/utils/common";
import {
  getLicenseExpiryDate,
  switchTabs,
  verifyAccessTab,
  verifyDomainTab,
  verifyLicenseTab,
  verifyResourceLimit,
  verifySubTabsAndStoreCurrentLimits,
  verifyTotalLimitsWithPlan
} from "Support/utils/license";
import { settingsText, workspaceSettingsText } from "Texts/common";
import { licenseText } from "Texts/license";
import { dashboardSelector } from "Selectors/dashboard";

describe("License Page", () => {
  const data = {};

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("Should verify license page elements with the paid plan", () => {
    cy.writeFile("cypress/fixtures/license/currentLimits.json", {});

    cy.apiUpdateLicense("validWithLimits");

    getLicenseExpiryDate().then((expectedText) => {
      common.navigateToSettingPage();
      cy.get(licenseSelectors.listOfItems(licenseText.license)).click();
      cy.get(licenseSelectors.expiryStatus).should("have.text", expectedText);
    });

    cy.contains(licenseText.licenseOverviewTitle).should("be.visible");
    cy.get(commonSelectors.breadcrumbPageTitle).should(
      "have.text",
      licenseText.license
    );
    cy.get(licenseSelectors.comparePlansText)
      .should("be.visible")
      .and("contain.text", licenseText.comparePlansText);

    switchTabs(licenseText.licenseKeyLabel);
    verifyLicenseTab();

    switchTabs(licenseText.limitsTabTitle);
    const limitSubTabs = [
      "aiCredits",
      "apps",
      "workspaces",
      "users",
      "workflows",
      "tables",
    ];
    limitSubTabs.forEach((subTab) => {
      verifySubTabsAndStoreCurrentLimits(
        licenseText.limitsTab[`${subTab}SubTab`],
        licenseText[`${subTab}SubTab`]
      );
    });

    switchTabs(licenseText.accessTabTitle);
    verifyAccessTab(true);

    switchTabs(licenseText.domainTabTitle);
    verifyDomainTab();
  });

  it("Should verify banners and tooltips with the paid plan", () => {
    const planName = "Enterprise";
    cy.get(commonSelectors.workspaceName).click();

    cy.get(licenseSelectors.workspaceCount).should("be.visible");
    cy.get(commonSelectors.addWorkspaceButton).should("be.visible");
    verifyResourceLimit("workspaces", planName);

    cy.get(dashboardSelector.homePageContent).click();
    verifyResourceLimit("apps", planName);

    // cy.get(workflowSelector.globalWorkFlowsIcon).click();
    // verifyResourceLimit("workflow", planName);

    common.navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();
    verifyResourceLimit("builders", planName, "usage");

    cy.reload();

    common.navigateToManageGroups();
    cy.get(groupsSelector.createNewGroupButton).should("be.enabled");

    cy.get(
      licenseSelectors.listOfItems(workspaceSettingsText.customStylesListItem)
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("not.exist");
    cy.get(commonSelectors.saveButton).should("be.enabled");

    cy.get(
      licenseSelectors.listOfItems(
        workspaceSettingsText.configureGitSyncListItem
      )
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("not.exist");

    cy.get(
      licenseSelectors.listOfItems(workspaceSettingsText.themesListItem)
    ).click();
    cy.get('[data-cy="create-new-theme-button"]').should("be.enabled");

    common.navigateToSettingPage();
    cy.get(licenseSelectors.listOfItems(settingsText.allUsersListItem)).click({
      force: true,
    });

    verifyTotalLimitsWithPlan(["builders", "end-users", "user"], planName);

    cy.get(
      licenseSelectors.listOfItems(settingsText.manageInstanceSettingsListItem)
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("not.exist");
    cy.get(instanceSettingsSelector.allowWorkspaceToggle)
      .eq(0)
      .should("not.be.checked");

    cy.get(
      licenseSelectors.listOfItems(settingsText.whiteLabellingListItem)
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("not.exist");
    cy.get(whiteLabellingSelectors.appLogoInput).should("be.enabled");

    cy.get(commonSelectors.workspaceConstantsIcon).click();

    cy.get(licenseSelectors.listOfItems("staging"))
      .should("be.visible")
      .and("not.be.disabled")
      .click();
    cy.get(workspaceConstantsSelectors.addNewConstantButton).should(
      "be.enabled"
    );

    cy.get(licenseSelectors.listOfItems("production"))
      .should("be.visible")
      .and("not.be.disabled")
      .click();
    cy.get(workspaceConstantsSelectors.addNewConstantButton).should(
      "be.enabled"
    );

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonEeSelectors.auditLogIcon).should("be.visible").click();
    cy.get(commonSelectors.pageSectionHeader).should("have.text", "Audit logs");

    // cy.apiCreateApp(`${fake.companyName}-license-App`);
    // cy.openApp();

    // cy.get('[data-cy="list-current-env-name"]').click();
    // cy.get('[data-cy="env-name-list"]')
    //   .eq(1)
    //   .within(() => {
    //     verifyTooltip(
    //       '[data-cy="env-name-dropdown"]',
    //       "Multi-environments are available only in paid plans"
    //     );
    //   });

    // cy.get('[data-cy="env-name-list"]')
    //   .eq(2)
    //   .within(() => {
    //     verifyTooltip(
    //       '[data-cy="env-name-dropdown"]',
    //       "Multi-environments are available only in paid plans"
    //     );
    //   });
  });
});
