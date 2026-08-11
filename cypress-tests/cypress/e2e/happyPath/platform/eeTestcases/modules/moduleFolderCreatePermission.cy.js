import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/manageGroups';
import { navigateToManageGroups } from 'Support/utils/common';
import { createGroupsAndAddUserInGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';
import { groupsText } from 'Texts/manageGroups';

describe('Modules — Folder Permissions: Custom Group Create Override', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-create-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense('valid');
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Strip the builder ROLE's own moduleFolderCreate so the only thing
    // granting create-access in this workspace is each test's own custom group.
    cy.apiUpdateGroupPermission('builder', { moduleFolderCreate: false });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it('custom group with moduleFolderCreate OFF blocks the builder from creating a module folder', () => {
    const groupName = `QA Module Folder Create Off Group ${testId}`;
    const userEmail = `qa-folder-create-off-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA Folder Create Off User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleFolderCreateCheck).should('not.be.checked');

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');
  });

  it('custom group with moduleFolderCreate ON allows the builder to create a module folder', () => {
    const groupName = `QA Module Folder Create On Group ${testId}`;
    const userEmail = `qa-folder-create-on-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA Folder Create On User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleFolderCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.createNewFolderButton).should('be.visible').and('be.enabled');
  });
});
