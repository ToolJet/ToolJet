import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/manageGroups';
import { navigateToManageGroups } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';
import { groupsText } from 'Texts/manageGroups';

describe('Modules — Folder Permissions: Custom Group Create Override', () => {
  const testId = Date.now();
  const wsName = `modules-folder-create-${testId}`;
  const wsSlug = wsName;

  let workspaceId, groupId1;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiUpdateGroupPermission('builder', { moduleFolderCreate: false });
  });

  it('custom group with moduleFolderCreate OFF blocks the builder from creating a module folder', () => {
    const groupName = `QA Module ${testId}`;
    const userEmail = `qa-folder-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    cy.apiLogout();

    cy.apiLogin();

    apiCreateGroup(groupName).then((groupId) => {
      groupId1 = groupId;
      apiAddUserToGroup(groupId1, userEmail);
    });
    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    cy.get('[data-cy="create-new-folder-button"]').should('not.exist');
    cy.apiLogout();

    cy.apiLogin();
    cy.visit(`/${wsSlug}`);

    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleFolderCreateCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get('[data-cy="create-new-folder-button"]').should('be.visible');
  });
});
