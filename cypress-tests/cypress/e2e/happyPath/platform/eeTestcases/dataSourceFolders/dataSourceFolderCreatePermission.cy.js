import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from 'Selectors/platform/dataSourceFolders';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openDataSourcesList,
  uiCreateDataSourceFolder,
  uiDeleteDataSourceFolder,
  uiOpenFolderMenu,
  uiVerifyDataSourceFolderExists,
} from 'Support/utils/platform/dataSourceFolders';
import { getGroupPermissionInput } from 'Support/utils/userPermissions';
import { groupsText } from 'Texts/platform/manageGroups';

describe('Data Source Folders — Custom Group Coarse Permission Overrides', () => {
  let workspaceId, groupId1, testId, wsName, wsSlug;

  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-create-${testId}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiUpdateGroupPermission('builder', getGroupPermissionInput(true, false));
    cy.apiDeleteGranularPermission('builder');
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('a custom group grants folder create and delete independently, each taking effect as it is enabled', () => {
    const groupName = `QA DS Folder ${testId}`;
    const userEmail = `ds-folder-create-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    cy.apiLogout();

    cy.apiLogin();
    apiCreateGroup(groupName).then((groupId) => {
      groupId1 = groupId;
      apiAddUserToGroup(groupId1, userEmail);
    });
    cy.apiLogout();

    // Create control is hidden while the coarse flag is off.
    cy.apiLogin(userEmail, 'password');
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('not.exist');
    cy.apiLogout();

    // Grant the coarse flag through the Permissions tab.
    cy.apiLogin();
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(dsFolderPerm.createCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
    cy.apiLogout();

    // Control reappears.
    cy.apiLogin(userEmail, 'password');
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('be.visible');

    // Create a folder so the delete affordance has something to act on. The modal
    // mechanics themselves are covered in dataSourceFolderDefaultAccess.cy.js —
    // here it is only setup for the permission check below.
    const folderName = `Create Only Folder ${testId}`;
    uiCreateDataSourceFolder(folderName);
    uiVerifyDataSourceFolderExists(folderName);

    cy.apiGetDataSourceFolderId(folderName).then((folderId) => {
      // Create alone does NOT imply delete. The ⋮ menu still renders, because the
      // frontend gates Rename on the create flag, but Delete must be absent.
      uiOpenFolderMenu(folderId);
      cy.get(dsFolder.folderRenameOption(folderId)).should('exist');
      cy.get(dsFolder.folderDeleteOption(folderId)).should('not.exist');
      cy.get('body').type('{esc}');
      cy.apiLogout();

      // Grant delete on the same group, through the same tab.
      cy.apiLogin();
      cy.visit(`/${wsSlug}/workspace-settings/groups`);
      cy.get(groupsSelector.groupLink(groupName)).click();
      cy.get(groupsSelector.permissionsLink).click();
      cy.get(dsFolderPerm.deleteCheckbox).check();
      cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
      cy.apiLogout();

      // Delete is now offered, and actually works end to end.
      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();
      uiOpenFolderMenu(folderId);
      cy.get(dsFolder.folderDeleteOption(folderId)).should('exist');
      cy.get('body').type('{esc}');

      uiDeleteDataSourceFolder(folderId);
      uiVerifyDataSourceFolderExists(folderName, false);
    });
  });

});
