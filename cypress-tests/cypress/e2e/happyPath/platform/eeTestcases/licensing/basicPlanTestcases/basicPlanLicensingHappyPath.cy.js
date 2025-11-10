import { commonSelectors } from "Selectors/common";
import {
  commonEeSelectors,
  instanceSettingsSelector,
  whiteLabellingSelectors,
} from "Selectors/eeCommon";
import { licenseSelectors } from "Selectors/license";
import { groupsSelector } from "Selectors/manageGroups";
import { usersSelector } from "Selectors/manageUsers";
import * as common from "Support/utils/common";
import {
  switchTabs,
  verifyAccessTab,
  verifyDomainTab,
  verifyLicenseTab,
  verifyResourceLimit,
  verifySubTabsAndStoreCurrentLimits,
  verifyTooltip,
  verifyTotalLimitsWithPlan
} from "Support/utils/license";
import { navigateToEditUser } from "Support/utils/manageUsers";
import { commonText, settingsText, workspaceSettingsText } from "Texts/common";
import { licenseText } from "Texts/license";
import { dashboardSelector } from "../../../../../constants/selectors/dashboard";

describe("License Page", () => {
  const data = {};

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
    verifyAccessTab();

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
    verifyResourceLimit("builders", planName, "usage");

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
});
