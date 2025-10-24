import { commonSelectors } from "Selectors/common";
import { commonText, settingsText, workspaceSettingsText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { licenseText } from "Texts/license";
import { licenseSelectors } from "Selectors/license";
import { usersSelector } from "Selectors/manageUsers";
import {
  switchTabs,
  verifylicenseTab,
  verifySubTabs,
  verifyAccessTab,
  verifyDomainTab,
  verifyResourceLimit,
  verifyTooltip,
} from "Support/utils/license";
import * as common from "Support/utils/common";
import { dashboardSelector } from "../../../../../constants/selectors/dashboard";
import { navigateToEditUser } from "Support/utils/manageUsers";
import {
  instanceSettingsSelector,
  whiteLabellingSelectors,
} from "Selectors/eeCommon";
import { workflowSelector } from "Selectors/workflows";

describe("License Page", () => {
  const data = {};

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("Should verify license page elements with the basic plan ", () => {
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
    verifylicenseTab();

    switchTabs(licenseText.limitsTabTitle);
    verifySubTabs(
      licenseText.limitsTab.aiCreditsSubTab,
      licenseText.aiCreditsSubTab,
      {
        "Monthly recurring": "0/0",
        "Add on credits": "0/0",
      }
    );
    verifySubTabs(licenseText.limitsTab.appsSubTab, licenseText.appsSubTab, {
      "Number of Apps": "1/2",
    });
    verifySubTabs(
      licenseText.limitsTab.workspacesSubTab,
      licenseText.workspacesSubTab,
      {
        "Number of Workspaces": "1/1",
      }
    );
    verifySubTabs(licenseText.limitsTab.usersSubTab, licenseText.usersSubTab, {
      "Number of Total Users": "1/52",
      "Number of Builders": "1/2",
      "Number of End Users": "0/50",
      "Number of Super Admins": "1/1",
    });
    verifySubTabs(
      licenseText.limitsTab.workflowsSubTab,
      licenseText.workflowsSubTab,
      {
        "Number of Workflows": "0/2",
      }
    );
    verifySubTabs(
      licenseText.limitsTab.tablesSubTab,
      licenseText.tablesSubTab,
      {
        "Number of Tables": "Unlimited",
      }
    );

    switchTabs(licenseText.accessTabTitle);
    verifyAccessTab();

    switchTabs(licenseText.domainTabTitle);
    verifyDomainTab();
  });

  it.only("Should verify banners and tooltips with the basic plan ", () => {
    cy.get(commonSelectors.workspaceName).click();

    cy.get('[data-cy="workspace-count"]').should("be.visible");
    verifyResourceLimit("workspaces", "basic");

    cy.get(dashboardSelector.homePageContent).click();
    verifyResourceLimit("apps", "basic");

    // cy.get(workflowSelector.globalWorkFlowsIcon).click();
    // verifyResourceLimit("workflow", "basic");

    common.navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();
    verifyResourceLimit("builders", "basic", "usage");

    cy.reload();

    common.navigateToManageGroups();
    cy.get('[data-cy="create-new-group-button"]').should("be.disabled");
    verifyTooltip(
      '[data-cy="create-new-group-button"]',
      "Custom groups are available only in paid plans",
      true
    );

    verifyResourceLimit(
      "custom-groups",
      "basic",
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
      "basic",
      "custom-themes",
      "Custom themes is our paid feature. Upgrade to a paid plan to add and customize themes."
    );

    common.navigateToSettingPage();
    cy.get(licenseSelectors.listOfItems(settingsText.allUsersListItem)).click({
      force: true,
    });
    navigateToEditUser(commonText.email);
    verifyResourceLimit(
      "edit-user",
      "basic",
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
    cy.apiCreateApp(`${fake.companyName}-license-App`);
    cy.openApp();
    cy.get('[data-cy="list-current-env-name"]').click();
    verifyTooltip(
      '[data-cy="env-name-dropdown"] :nth-child(1)',
      "Multi-environments are available only in paid plans",
      true
    );
    verifyTooltip(
      '[data-cy="env-name-dropdown"] :nth-child(2)',
      "Multi-environments are available only in paid plans",
      true
    );
  });
});
