import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/manageGroups';
import { moduleSelectors } from 'Selectors/platform/modules';
import { navigateToManageGroups } from 'Support/utils/common';
import { createGroupsAndAddUserInGroup } from 'Support/utils/manageGroups';
import { openModulesList, createModuleViaAPI } from 'Support/utils/platform/modules';
import { groupsText } from 'Texts/manageGroups';

describe('Modules — Coarse Permissions: Custom Group Delete Override & Ownership', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-coarse-delete-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Strip the builder ROLE's own moduleDelete — delete access for a module
    // a test user doesn't own comes only from that test's own custom group.
    cy.apiUpdateGroupPermission('builder', { moduleDelete: false });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it("non-owner without moduleDelete cannot delete another user's module", () => {
    // Unlike the Edit-button bug (AppCard.jsx's `canUpdate || appType ===
    // 'module'`), the "Delete module" menu ITEM is correctly gated by the
    // real canDeleteApp prop with no module override (AppMenu.jsx:158,
    // `{canDeleteApp && (...'Delete module'...)}` — confirmed by reading
    // source, 2026-08-11). So the option should be absent from the menu
    // entirely for a non-owner without moduleDelete, not shown-then-blocked.
    const moduleName = `Admin Owned Mod ${testId}-blocked`;
    const groupName = `QA Module Delete Blocked Group ${testId}`;
    const userEmail = `qa-coarse-delete-blocked-${testId}@example.com`;

    createModuleViaAPI(moduleName);
    cy.apiFullUserOnboarding('QA Coarse Delete Blocked User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.appCard(moduleName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(moduleSelectors.appCardMenuIcon)
      .click({ force: true });
    cy.get(commonSelectors.appCardOptions('delete module')).should('not.exist');
  });

  it('owner can always delete their own module regardless of moduleDelete', () => {
    const ownModuleName = `Own Mod ${testId}`;
    const userEmail = `qa-coarse-delete-owner-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA Coarse Delete Owner User', userEmail, 'builder', 'password', wsName);
    cy.apiLogin(userEmail, 'password');
    createModuleViaAPI(ownModuleName);

    openModulesList();
    cy.get(commonSelectors.appCard(ownModuleName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(moduleSelectors.appCardMenuIcon)
      .click({ force: true });
    cy.get(commonSelectors.appCardOptions('delete module')).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(commonSelectors.appCard(ownModuleName)).should('not.exist');
  });

  it("custom group with moduleDelete ON allows deleting another user's module", () => {
    const moduleName = `Admin Owned Mod ${testId}-allowed`;
    const groupName = `QA Module Delete Allowed Group ${testId}`;
    const userEmail = `qa-coarse-delete-allowed-${testId}@example.com`;

    createModuleViaAPI(moduleName);
    cy.apiFullUserOnboarding('QA Coarse Delete Allowed User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleDeleteCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.appCard(moduleName))
      .trigger('mousehover')
      .trigger('mouseenter')
      .find(moduleSelectors.appCardMenuIcon)
      .click({ force: true });
    cy.get(commonSelectors.appCardOptions('delete module')).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(commonSelectors.appCard(moduleName)).should('not.exist');
  });
});
