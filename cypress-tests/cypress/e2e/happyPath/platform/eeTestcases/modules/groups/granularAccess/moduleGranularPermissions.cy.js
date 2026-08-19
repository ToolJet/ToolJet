import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { moduleSelectors } from "Selectors/platform/modules";
import { versionModalSelector } from "Selectors/eeCommon";
import {
  createModuleViaAPI,
  authorModuleContract,
  publishModuleVersion,
  dragModuleIntoCanvas,
  openModulesList,
} from "Support/utils/platform/modules";
import { apiCreateGroup } from "Support/utils/manageGroups";

describe("Modules — Granular Permissions", () => {
  const testId = Date.now();
  const shortId = String(testId).slice(-6);
  const wsName = `modules-permissions-${testId}`;
  const wsSlug = wsName;

  const editModuleName = `Edit Mod ${shortId}`;
  const buildWithModuleName = `BW Mod ${shortId}`;
  const groupName = `QA Module Permission Group ${testId}`;

  let workspaceId;
  let editModuleId;
  let buildWithModuleId;

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense("valid");
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });

    cy.apiStripRoleAppDefault("builder", "module");

    cy.then(() => {
      createModuleViaAPI(editModuleName).then((module) => {
        editModuleId = module.id;
      });
      authorModuleContract();
      publishModuleVersion("v1", "v1-published");
    });

    cy.then(() => {
      createModuleViaAPI(buildWithModuleName).then((module) => {
        buildWithModuleId = module.id;
      });
      authorModuleContract();
      publishModuleVersion("v1", "v1-published");
    });

    apiCreateGroup(groupName);

    cy.then(() => {
      cy.apiCreateGranularPermission(
        groupName,
        "Edit Module",
        "module",
        { canEdit: true, canView: false, hideFromDashboard: false },
        [editModuleId],
        false
      );
      cy.apiCreateGranularPermission(
        groupName,
        "Build-with Module",
        "module",
        { canEdit: false, canView: true, hideFromDashboard: false },
        [buildWithModuleId],
        false
      );
    });

    cy.apiLogout();
  });

  after(() => {
    cy.apiLogin("dev@tooljet.io", "password", workspaceId);
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin("dev@tooljet.io", "password", workspaceId);
  });

  it("Edit-level granular access lets a non-owner actually edit a module", () => {
    const attemptId = Date.now();
    const grantedUserEmail = `qa-granular-edit-${attemptId}@example.com`;
    cy.apiFullUserOnboarding(
      "QA Granular Edit User",
      grantedUserEmail,
      "builder",
      "password",
      wsName,
      {},
      [groupName]
    );

    cy.apiLogin(grantedUserEmail, "password");
    cy.visit(`/${Cypress.env("workspaceSlug")}/apps/${editModuleId}`, {
      failOnStatusCode: false,
    });
    cy.wait(3000);

    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector("create draft version")).click();
    cy.get(versionModalSelector.versionNameInput).type("v2-edit-allowed");
    cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
    cy.get(commonSelectors.toastMessage).should("not.exist");
    cy.get(moduleSelectors.versionSwitcherButton).should("contain.text", "v2-edit-allowed");
  });

  it("a Build-with user's module card shows the correct access-level button", () => {
    // KNOWN BUG (confirmed by reading source, 2026-08-10): AppCard.jsx's
    // edit-button condition is `canUpdate || appType === 'module'` — true
    // for ANY module regardless of canUpdate, so the correct view-button
    // branch right below it (`!canUpdate && canView && appType === 'module'`)
    // is unreachable dead code. A Build-with (view-only) module's card should
    // show "View", not "Edit" — left failing intentionally as documentation.
    const attemptId = Date.now();
    const grantedUserEmail = `qa-granular-cardview-${attemptId}@example.com`;
    cy.apiFullUserOnboarding(
      "QA Granular Card View User",
      grantedUserEmail,
      "builder",
      "password",
      wsName,
      {},
      [groupName]
    );

    cy.apiLogin(grantedUserEmail, "password");
    openModulesList();
    cy.get(commonSelectors.appCard(buildWithModuleName))
      .trigger("mousehover")
      .trigger("mouseenter")
      .within(() => {
        cy.get('[data-cy="view-button"]').should("exist");
        cy.get('[data-cy="edit-button"]').should("not.exist");
      });
  });

  it("a Build-with user can consume the module in an app but cannot edit it", () => {
    const attemptId = Date.now();
    const grantedUserEmail = `qa-granular-consume-${attemptId}@example.com`;
    const consumerAppName = `BW App ${attemptId}-consume`;
    cy.apiFullUserOnboarding(
      "QA Granular Consume User",
      grantedUserEmail,
      "builder",
      "password",
      wsName,
      {},
      [groupName]
    );

    cy.apiLogin(grantedUserEmail, "password");
    cy.apiCreateApp(consumerAppName);

    // Consumption: Build-with is enough to drag the module into a consuming app.
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    cy.get(commonSelectors.appCard(consumerAppName))
      .trigger("mousehover")
      .trigger("mouseenter")
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    dragModuleIntoCanvas(buildWithModuleName);
    cy.get(commonWidgetSelector.draggableWidget("moduleviewer1")).should("exist");


    cy.visit(`/${Cypress.env("workspaceSlug")}/apps/${buildWithModuleId}`, {
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

  it("an end-user has no access to the Modules section, but can still view a consuming app's released output that embeds a module they have no module-level permission for", () => {
    const attemptId = Date.now();
    const grantedUserEmail = `qa-granular-enduser-embed-${attemptId}@example.com`;
    const endUserEmail = `qa-permissions-enduser-${attemptId}@example.com`;
    const consumerAppName = `BW App ${attemptId}-enduser`;
    let consumerAppId;

    cy.apiFullUserOnboarding(
      "QA Granular End User Embed User",
      grantedUserEmail,
      "builder",
      "password",
      wsName,
      {},
      [groupName]
    );

    cy.apiLogin(grantedUserEmail, "password");
    cy.apiCreateApp(consumerAppName).then(() => {
      consumerAppId = Cypress.env("appId");
    });

    // Embed the Build-with module into this consumer app so an end-user can
    // view it independently of any module-level grant.
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    cy.get(commonSelectors.appCard(consumerAppName))
      .trigger("mousehover")
      .trigger("mouseenter")
      .find(commonSelectors.editButton)
      .click({ force: true });
    cy.wait(2000);

    dragModuleIntoCanvas(buildWithModuleName);
    cy.get(commonWidgetSelector.draggableWidget("moduleviewer1")).should("exist");

    cy.intercept("GET", `/api/apps/${consumerAppId}`).as("getConsumerAppData");
    cy.reload();
    cy.wait("@getConsumerAppData").then((interception) => {
      Cypress.env("appId", consumerAppId);
      Cypress.env("editingVersionId", interception.response.body.editing_version.id);
    });

    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector("v1 save version")).click();
    cy.get(commonWidgetSelector.parameterInputField("version name")).clear().type("v1");
    cy.get(commonSelectors.buttonSelector("create version save")).click();
    cy.get(moduleSelectors.versionLockBanner, { timeout: 15000 }).should("be.visible");


    cy.apiLogin();
    cy.apiReleaseApp(consumerAppName);

    // N
    cy.apiFullUserOnboarding(
      "QA Permissions End User",
      endUserEmail,
      "end-user",
      "password",
      wsName
    );
    cy.apiLogout();

    cy.apiLogin(endUserEmail, "password");


    cy.visit(`/${Cypress.env("workspaceSlug")}/modules`);
    cy.get(commonSelectors.pageSectionHeader, { timeout: 20000 }).should(
      "contain.text",
      "Applications"
    );

    cy.visit(`/${Cypress.env("workspaceSlug")}/apps/${buildWithModuleId}`, {
      failOnStatusCode: false,
    });
    cy.get(moduleSelectors.versionSwitcherButton).should("not.exist");

    cy.then(() => {
      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${consumerAppId}`,
      });
    });
    cy.appUILogin(endUserEmail, "password");
    cy.get(commonWidgetSelector.draggableWidget("moduleviewer1")).should("exist");
  });
});
