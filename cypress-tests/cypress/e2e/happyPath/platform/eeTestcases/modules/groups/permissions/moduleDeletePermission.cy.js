import { commonSelectors } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { createModuleViaAPI, openModulesList } from 'Support/utils/platform/modules';

describe('Modules — Coarse Permissions: Custom Group Delete Override & Ownership', () => {
  const testId = Date.now();
  const wsName = `modules-coarse-delete-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiUpdateGroupPermission('builder', { moduleDelete: false });
    cy.viewport(2000, 1900);
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  const openDeleteMenu = (moduleName) => {
    cy.get(commonSelectors.appCard(moduleName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(moduleSelectors.appCardMenuIcon)
      .click({ force: true });
  };

  it("non-owner is blocked, ownership overrides it, and a custom group grant then unlocks deleting another user's module", () => {
    const adminModuleName = `Admin Owned Mod ${testId}`;
    const ownModuleName = `Own Mod ${testId}`;
    const groupName = `QA Module Delete Group ${testId}`;
    const userEmail = `qa-coarse-delete-${testId}@example.com`;

    // Admin creates a module the builder does not own.
    createModuleViaAPI(adminModuleName);
    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);

    cy.apiLogin(userEmail, 'password');

    openModulesList();
    openDeleteMenu(adminModuleName);
    cy.get(commonSelectors.appCardOptions('delete module')).should('not.exist');

    // Owner can always delete their own module regardless of moduleDelete.
    createModuleViaAPI(ownModuleName);
    openModulesList();
    openDeleteMenu(ownModuleName);
    cy.get(commonSelectors.appCardOptions('delete module')).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(commonSelectors.appCard(ownModuleName)).should('not.exist');

    cy.apiLogout();
    cy.apiLogin();

    // Grant delete access to the admin's module via a custom group — set up
    // entirely via API, no Manage Groups UI involved.
    apiCreateGroup(groupName).then((groupId) => {
      apiAddUserToGroup(groupId, userEmail);
    });
    cy.apiUpdateGroupPermission(groupName, { moduleDelete: true });

    cy.apiLogout();
    cy.apiLogin(userEmail, 'password');

    // Custom group with moduleDelete ON allows deleting another user's module.
    openModulesList();
    openDeleteMenu(adminModuleName);
    cy.get(commonSelectors.appCardOptions('delete module')).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(commonSelectors.appCard(adminModuleName)).should('not.exist');
  });
});
