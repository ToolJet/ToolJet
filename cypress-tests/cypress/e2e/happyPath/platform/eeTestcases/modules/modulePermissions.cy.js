import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { moduleSelectors } from "Selectors/platform/modules";
import { versionModalSelector } from "Selectors/eeCommon";
import { navigateToManageGroups } from "Support/utils/common";
import { apiCreateGroup } from "Support/utils/manageGroups";
import {
  createModuleViaAPI,
  authorModuleContract,
  publishModuleVersion,
  dragModuleIntoCanvas,
} from "Support/utils/platform/modules";
import { groupsText } from "Texts/manageGroups";


describe("Modules — Permissions Negative: Build-with User Blocked From Editing", () => {
  const testId = Date.now();
  const shortId = String(testId).slice(-6);
  const wsName = `modules-permissions-${testId}`;
  const wsSlug = wsName;

  const moduleName = `BW Mod ${shortId}`;
  const permissionName = `QA Module Permission ${testId}`;
  const groupName = `QA Build-With Group ${testId}`;
  const consumerAppName = `BW App ${shortId}`;
  const buildWithUserEmail = `qa-buildwith-${testId}@example.com`;

  let workspaceId;
  let moduleAppId;

  const configureModuleBuildWithPermission = () => {
    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.granularLink).click();

    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(moduleSelectors.addModuleButton).click();

    cy.clearAndType(groupsSelector.permissionNameInput, permissionName);
    cy.get(moduleSelectors.buildWithPermissionRadio).check({ force: true });
    cy.get(groupsSelector.customRadio).check();
    cy.get(groupsSelector.granularPermissionResourceContainer)
      .click({ force: true })
      .type(`${moduleName}{enter}`);
    cy.get(groupsSelector.confimButton).click({ force: true });
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.createPermissionToast);
  };

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense("valid");
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });

    cy.then(() => {
      createModuleViaAPI(moduleName).then((module) => {
        moduleAppId = module.id;
      });
      authorModuleContract();
      publishModuleVersion("v1", "v1-published");
    });


    cy.then(() => {
      cy.visit(`/${Cypress.env("workspaceSlug")}`);
    });

    apiCreateGroup(groupName);
    configureModuleBuildWithPermission();

    cy.apiFullUserOnboarding(
      "QA BuildWith User",
      buildWithUserEmail,
      "builder",
      "password",
      wsName,
      {},
      [groupName]
    );

    cy.apiCreateApp(consumerAppName);

    cy.apiLogout();
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin(buildWithUserEmail, "password");
  });

  it("TC-12 step 1-2: a Build-with user can drag the module into a consuming app", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    cy.get(commonSelectors.appCard(consumerAppName))
      .trigger("mousehover")
      .trigger("mouseenter")
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    dragModuleIntoCanvas(moduleName);
    cy.get(commonWidgetSelector.draggableWidget("moduleviewer1")).should("exist");
  });

  it("TC-12 step 3: a Build-with user cannot open the module builder for editing", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}/apps/${moduleAppId}`, {
      failOnStatusCode: false,
    });
    cy.wait(3000);


    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector("create draft version")).click();
    cy.get(versionModalSelector.versionNameInput).type("v2-blocked-draft");
    cy.get(
      versionModalSelector.createDraftVersionModal.createButton
    ).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You do not have permission to create a draft version"
    );
  });
});
