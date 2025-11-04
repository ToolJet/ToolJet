import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { commonText, settingsText, workspaceSettingsText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { licenseText } from "Texts/license";
import { licenseSelectors } from "Selectors/license";
import { usersSelector } from "Selectors/manageUsers";
import {
  switchTabs,
  verifyLicenseTab,
  verifySubTabsAndStoreCurrentLimits,
  verifyAccessTab,
  verifyDomainTab,
  verifyResourceLimit,
  verifyTooltip,
  verifyTotalLimitsWithPlan,
  getLicenseExpiryDate,
} from "Support/utils/license";
import * as common from "Support/utils/common";
import { dashboardSelector } from "../../../../../constants/selectors/dashboard";
import { navigateToEditUser } from "Support/utils/manageUsers";
import {
  instanceSettingsSelector,
  whiteLabellingSelectors,
} from "Selectors/eeCommon";
import { commonEeSelectors } from "Selectors/eeCommon";

describe("License Page", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("Should verify license page elements with the basic plan", () => {
    common.navigateToSettingPage();
    cy.get(licenseSelectors.listOfItems(licenseText.license)).click();

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
    verifyAccessTab(false);

    switchTabs(licenseText.domainTabTitle);
    verifyDomainTab();
  });

  it("Should verify banners and tooltips with the basic plan", () => {
    const planName = "basic";
    cy.get(commonSelectors.workspaceName).click();

    cy.get('[data-cy="workspace-count"]').should("be.visible");
    verifyResourceLimit("workspaces", planName);

    cy.get(dashboardSelector.homePageContent).click();
    verifyResourceLimit("apps", planName);

    // cy.get(workflowSelector.globalWorkFlowsIcon).click();
    // verifyResourceLimit("workflow", planName);

    common.navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();

    verifyResourceLimit("builder", planName, "usage");

    cy.reload();

    common.navigateToManageGroups();
    cy.get(groupsSelector.createNewGroupButton).should("be.disabled");
    verifyTooltip(
      groupsSelector.createNewGroupButton,
      "Custom groups are not available in your plan",
      true
    );

    verifyResourceLimit(
      "custom-groups",
      planName,
      "custom-groups",
      "Custom groups & permissions are paid features"
    );

    cy.get(
      licenseSelectors.listOfItems(workspaceSettingsText.customStylesListItem)
    ).click();
    cy.get('[data-cy="modal-close"]').click();
    cy.get(licenseSelectors.paidFeatureButton).should("be.visible");

    cy.get(
      licenseSelectors.listOfItems(
        workspaceSettingsText.configureGitSyncListItem
      )
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("be.visible");

    cy.get(
      licenseSelectors.listOfItems(workspaceSettingsText.themesListItem)
    ).click();
    verifyResourceLimit(
      "custom-themes",
      planName,
      "custom-themes",
      "Custom themes is our paid feature. Upgrade to a paid plan to add and customize themes."
    );

    common.navigateToSettingPage();
    cy.get(licenseSelectors.listOfItems(settingsText.allUsersListItem)).click({
      force: true,
    });

    verifyTotalLimitsWithPlan(["builders", "end-users", "user"], planName);

    navigateToEditUser(commonText.email);
    verifyResourceLimit(
      "edit-user",
      planName,
      "edit-user",
      "Edit user details with our paid plans. For more,"
    );

    cy.reload();
    cy.get(
      licenseSelectors.listOfItems(settingsText.manageInstanceSettingsListItem)
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("be.visible");
    cy.get(instanceSettingsSelector.allowWorkspaceToggle).should("be.disabled");
    cy.get(
      licenseSelectors.listOfItems(settingsText.whiteLabellingListItem)
    ).click();
    cy.get(licenseSelectors.paidFeatureButton).should("be.visible");
    cy.get(whiteLabellingSelectors.appLogoInput).should("be.disabled");

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    verifyTooltip(
      licenseSelectors.listOfItems("staging"),
      "Multi-environments are available only in paid plans",
      true
    );
    verifyTooltip(
      licenseSelectors.listOfItems("production"),
      "Multi-environments are available only in paid plans",
      true
    );

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.settingsIcon).click();
    verifyTooltip(
      commonEeSelectors.auditLogIcon,
      "Audit logs are available only in paid plans",
      true
    );

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
