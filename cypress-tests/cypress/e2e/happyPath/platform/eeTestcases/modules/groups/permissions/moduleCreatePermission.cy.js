import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/manageGroups';
import { navigateToManageGroups } from 'Support/utils/common';
import { createGroupsAndAddUserInGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';
import { groupsText } from 'Texts/manageGroups';

describe('Modules — Coarse Permissions: Custom Group Create Override', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-coarse-create-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Strip the builder ROLE's own moduleCreate so the only thing granting
    // create-access in this workspace is each test's own custom group.
    cy.apiUpdateGroupPermission('builder', { moduleCreate: false });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it('custom group with moduleCreate OFF blocks the builder from creating a module', () => {
    const groupName = `QA Module Create Off Group ${testId}`;
    const userEmail = `qa-coarse-create-off-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA Coarse Create Off User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleCreateCheck).should('not.be.checked');

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.buttonSelector('create new modules')).should('not.exist');
  });

  it('custom group with moduleCreate ON allows the builder to create a module', () => {
    const groupName = `QA Module Create On Group ${testId}`;
    const userEmail = `qa-coarse-create-on-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA Coarse Create On User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.buttonSelector('create new modules')).first().should('be.visible').and('be.enabled');
  });
});
