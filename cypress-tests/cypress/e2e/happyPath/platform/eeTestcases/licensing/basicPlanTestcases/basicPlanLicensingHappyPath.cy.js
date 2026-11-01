import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  multiEnvSelector,
  instanceSettingsSelector,
  whiteLabellingSelectors,
} from "Selectors/platform/eeCommon";
import { licenseSelectors } from "Selectors/platform/license";
import { groupsSelector } from "Selectors/platform/manageGroups";
import { usersSelector } from "Selectors/platform/manageUsers";
import * as common from "Support/utils/common";
import {
  switchTabs,
  verifyAccessTab,
  verifyDomainTab,
  verifyLicenseTab,
  verifyResourceLimit,
  verifySubTabsAndStoreCurrentLimits,
  verifyTooltip,
  verifyTotalLimitsWithPlan,
} from "Support/utils/license";
import { navigateToEditUser } from "Support/utils/manageUsers";
import { commonText, settingsText, workspaceSettingsText } from "Texts/common";
import { licenseText } from "Texts/platform/license";
import { dashboardSelector } from "Selectors/platform/dashboard";
import { workflowSelector } from "Selectors/platform/workflows";


describe("License Page", () => {
  const data = {
    appName1: `${fake.companyName}-License-App-1`,
    workflowName: `${fake.companyName}-Workflow`,
  };
  beforeEach(() => {
    cy.apiLogin();
    cy.apiDeleteAllApps();
    for (let i = 0; i < 9; i++) {
      cy.apiCreateApp(`${data.appName1}-${i}`);
    }
    cy.visit("/my-workspace");
    cy.intercept("GET", "/api/v2/group-permissions/**").as(
      "getGroupPermissions"
    );
  });

  after(() => {
    cy.apiDeleteAllApps();
    cy.apiDeleteAllWorkflows();
  });

  it("Should verify license page elements with the basic plan", () => {

    cy.apiCreateWorkflow(data.workflowName);
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
    cy.get(commonSelectors.workspaceCount).should("be.visible");

    cy.get(dashboardSelector.homePageContent).click();
    cy.get(commonSelectors.dashboardIcon).click();

    cy.get(workflowSelector.globalWorkFlowsIcon).click();
    cy.get(commonSelectors.breadcrumbPageTitle).should(
      "have.text",
      "All workflows"
    );
    cy.get(workflowSelector.allWorkflowsLink).should("be.visible");

    common.navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(licenseSelectors.limitCounter).should("be.visible");

    cy.reload();

    common.navigateToManageGroups();
    cy.wait("@getGroupPermissions");
    cy.get(groupsSelector.createNewGroupButton).should("not.exist");
    cy.get(licenseSelectors.planTag("customGroups"))
      .should("be.visible")
      .and("not.have.text", "");
    verifyTooltip(licenseSelectors.planTag("customGroups"), "Custom groups");

    cy.get(
      licenseSelectors.listOfItems(workspaceSettingsText.customStylesListItem)
    ).click();
    cy.get(licenseSelectors.planTag("customStyling")).should("be.visible");

    cy.get(
      licenseSelectors.listOfItems(
        workspaceSettingsText.configureGitSyncListItem
      )
    ).click();
    cy.get(licenseSelectors.planTag("gitSync")).should("be.visible");

    cy.get(
      licenseSelectors.listOfItems(workspaceSettingsText.themesListItem)
    ).click();
    cy.get(licenseSelectors.planTag("customThemes")).should("be.visible");

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
    cy.get(licenseSelectors.planTag("multiPlayerEdit")).should("be.visible");
    cy.get(instanceSettingsSelector.allowWorkspaceToggle).should("be.disabled");
    cy.get(
      licenseSelectors.listOfItems(settingsText.whiteLabellingListItem)
    ).click();
    cy.get(licenseSelectors.planTag("whiteLabelling")).should("be.visible");
    cy.get(whiteLabellingSelectors.appLogoInput).should("be.disabled");

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    cy.get(licenseSelectors.planTag("multiEnvironment"))
      .should("have.length.at.least", 1)
      .and("be.visible");

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(licenseSelectors.planTag("auditLogs")).should("be.visible");

    cy.openApp(data.appName1);

    cy.get(multiEnvSelector.environmentsTag("development")).click();
    cy.get(multiEnvSelector.environmentsTag("staging")).within(() => {
      cy.get(licenseSelectors.planTag("multiEnvironment")).should("exist");
    });
    cy.get(multiEnvSelector.environmentsTag("production")).within(() => {
      cy.get(licenseSelectors.planTag("multiEnvironment")).should("exist");
    });

  });
});
