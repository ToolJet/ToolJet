import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { versionModalSelector } from "Selectors/eeCommon";
import { moduleSelectors } from "Selectors/platform/modules";
import { apiCreateGroup } from "Support/utils/manageGroups";
import {
  authorModuleContract,
  createModuleViaAPI,
  dragModuleIntoCanvas,
  openModulesList,
  publishModuleVersion,
} from "Support/utils/platform/modules";

describe("Modules — Granular Permissions", () => {
  let workspaceId, wsName, wsSlug;

  // Creates a fresh module, authors + publishes v1, grants it to a custom
  // group with the given permissions, and onboards a builder into that
  // group. Returns the created IDs/names for the test to use.
  const setupModuleAccess = (label, permissions) => {
    const attemptId = Date.now();
    const moduleName = `${label} Mod ${attemptId}`;
    const groupName = `QA ${label} Group ${attemptId}`;
    const userEmail = `qa-granular-${label.toLowerCase().replace(/\s+/g, "-")}-${attemptId}@example.com`;
    let moduleId;

    return cy
      .then(() => createModuleViaAPI(moduleName))
      .then((module) => {
        moduleId = module.id;
        authorModuleContract();
        publishModuleVersion("v1", "v1-published");
      })
      .then(() => apiCreateGroup(groupName))
      .then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} perm`,
          "module",
          permissions,
          [moduleId],
          false
        )
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, "builder", "password", wsName, {}, [groupName]))
      .then(() => ({ moduleId, moduleName, groupName, userEmail }));
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `modules-permissions-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiUpdateLicense("valid");
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });

    cy.apiDeleteGranularPermission("builder", ["module"]);
  });

  it("Edit-level granular access lets a non-owner actually edit a module", () => {
    setupModuleAccess("Edit", { canEdit: true, canView: false, hideFromDashboard: false }).then(
      ({ moduleId, userEmail }) => {
        cy.apiLogin(userEmail, "password");
        cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
        cy.wait(3000);

        cy.get(moduleSelectors.versionSwitcherButton).click();
        cy.get(commonSelectors.buttonSelector("create draft version")).click();
        cy.get(versionModalSelector.versionNameInput).type("v2-edit-allowed");
        cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
        cy.get(commonSelectors.toastMessage).should("not.exist");
        cy.get(moduleSelectors.versionSwitcherButton).should("contain.text", "v2-edit-allowed");
      }
    );
  });

  it("a Build-with user's module card shows the correct access-level button", () => {
    setupModuleAccess("CardView", { canEdit: false, canView: true, hideFromDashboard: false }).then(
      ({ moduleName, userEmail }) => {
        cy.apiLogin(userEmail, "password");
        openModulesList();
        cy.get(commonSelectors.appCard(moduleName))
          .trigger("mousehover")
          .trigger("mouseenter")
          .within(() => {
            cy.get('[data-cy="view-button"]').should("exist");
            cy.get('[data-cy="edit-button"]').should("not.exist");
          });
      }
    );
  });

  it("a Build-with user can consume the module in an app but cannot edit it", () => {
    setupModuleAccess("Consume", { canEdit: false, canView: true, hideFromDashboard: false }).then(
      ({ moduleId, moduleName, userEmail }) => {
        const consumerAppName = `${moduleName}-consumer`;

        cy.apiLogin(userEmail, "password");
        cy.apiCreateApp(consumerAppName);

        // Consumption: Build-with is enough to drag the module into a consuming app.
        cy.visit(`/${wsSlug}`);
        cy.get(commonSelectors.appCard(consumerAppName))
          .trigger("mousehover")
          .trigger("mouseenter")
          .find(commonSelectors.editButton)
          .click({ force: true });
        cy.wait(2000);

        dragModuleIntoCanvas(moduleName);
        cy.get(commonWidgetSelector.draggableWidget("moduleviewer1")).should("exist");

        // Editing: attempting the one action that would unlock editing (creating
        // a draft version) is blocked.
        cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
        cy.wait(3000);

        cy.get(moduleSelectors.versionSwitcherButton).click();
        cy.get(commonSelectors.buttonSelector("create draft version")).click();
        cy.get(versionModalSelector.versionNameInput).type("v2-blocked-draft");
        // Build-with (view-only) users get the create button pre-disabled —
        // the modal never lets the request through, so no toast fires.
        cy.get(versionModalSelector.createDraftVersionModal.createButton).should("be.disabled");
      }
    );
  });
});
