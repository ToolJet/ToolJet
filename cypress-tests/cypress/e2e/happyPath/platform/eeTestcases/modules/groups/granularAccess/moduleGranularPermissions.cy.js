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

    // The builder ROLE itself is seeded with canEdit:true (All modules) by default
    // (DEFAULT_RESOURCE_PERMISSIONS[BUILDER][MODULE]) — strip it so the Build-with
    // (view-only) custom group grant below is the only source of access for that
    // module, not silently overridden by the role default's edit access.
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
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it("Edit-level granular access lets a non-owner actually edit a module", () => {
    const grantedUserEmail = `qa-granular-edit-${testId}@example.com`;
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
    const grantedUserEmail = `qa-granular-cardview-${testId}@example.com`;
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
    const grantedUserEmail = `qa-granular-consume-${testId}@example.com`;
    const consumerAppName = `BW App ${shortId}-consume`;
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

    // Editing: attempting the one action that would unlock editing (creating
    // a draft version) is blocked. KNOWN BUG (confirmed live, 2026-08-07 and
    // 2026-08-10): this toast appears, but the draft version is actually
    // created anyway — a real server-side permission bypass, left failing
    // intentionally.
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
    const grantedUserEmail = `qa-granular-enduser-embed-${testId}@example.com`;
    const endUserEmail = `qa-permissions-enduser-${testId}@example.com`;
    const consumerAppName = `BW App ${shortId}-enduser`;
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

    // Release directly from development — no need to promote through
    // staging/production first (release just designates which version is
    // "released"; that's orthogonal to environment-scoped preview access).
    // Promoting DID fail with a 400 here previously (likely
    // checkModulesPromotableToEnvironment, since the embedded module was
    // never itself promoted past development) — irrelevant to what this
    // test actually needs.
    cy.apiLogin();
    cy.apiReleaseApp(consumerAppName);

    // No module-level grant at all for this end-user — only default
    // end-user access to the released consumer app.
    cy.apiFullUserOnboarding(
      "QA Permissions End User",
      endUserEmail,
      "end-user",
      "password",
      wsName
    );
    cy.apiLogout();

    cy.apiLogin(endUserEmail, "password");

    // No access to the Modules section itself: visiting /modules redirects
    // an end-user to the Applications dashboard instead of showing the list
    // (confirmed live, 2026-08-10 — not just an empty list, an actual
    // redirect away from the page).
    cy.visit(`/${Cypress.env("workspaceSlug")}/modules`);
    cy.get(commonSelectors.pageSectionHeader, { timeout: 20000 }).should(
      "contain.text",
      "Applications"
    );

    // Direct URL to the module's own editor shouldn't grant access either —
    // end-users can't open any app/module editor.
    cy.visit(`/${Cypress.env("workspaceSlug")}/apps/${buildWithModuleId}`, {
      failOnStatusCode: false,
    });
    cy.get(moduleSelectors.versionSwitcherButton).should("not.exist");

    // But the released consuming app — which the end-user DOES have access
    // to — should still resolve the embedded module correctly. Proves module
    // permissions don't gate app-level consumption; the real enforcement is
    // at the consuming app's own permission layer.
    cy.then(() => {
      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${consumerAppId}`,
      });
    });
    cy.appUILogin(endUserEmail, "password");
    cy.get(commonWidgetSelector.draggableWidget("moduleviewer1")).should("exist");
  });
});
