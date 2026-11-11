import { commonSelectors } from 'Selectors/common';
import {
  dataSourceFolderSelectors as dsFolder,
  dataSourceFolderPermissionSelectors as dsFolderPerm,
} from 'Selectors/platform/dataSourceFolders';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  dragDataSourceToFolder,
  dragDataSourceToStrayList,
  openDataSourcesList,
  uiCreateDataSourceFolder,
  uiDeleteDataSourceFolder,
  uiEnsureFolderExpanded,
  uiOpenFolderMenu,
  uiVerifyDataSourceFolderExists,
  uiVerifyFolderMenuAbsent,
} from 'Support/utils/platform/dataSourceFolders';
import { getGroupPermissionInput } from 'Support/utils/userPermissions';
import { groupsText } from 'Texts/platform/manageGroups';

describe('Data Source Folders — Custom Group Coarse Permission Overrides', () => {
  let workspaceId, groupId1, testId, wsName, wsSlug;

  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-create-${testId}`;
    wsSlug = wsName;
    cy.viewport(1800, 1400);

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

  it('a custom group grants folder create (with membership) and delete independently, each taking effect as it is enabled', () => {
    const groupName = `QA DS Folder ${testId}`;
    const userEmail = `ds-folder-create-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    cy.apiLogout();

    cy.apiLogin();
    const dataSourceName = `ds-create-flag-${testId}`;
    cy.apiCreateGlobalDataSource(dataSourceName);
    const adminFolderName = `Admin DS Folder ${testId}`;
    let adminFolderId;
    cy.apiCreateDataSourceFolder(adminFolderName).then((folder) => {
      adminFolderId = folder.id;
      cy.apiCreateGlobalDataSource(`ds-admin-folder-${testId}`).then((id) => cy.apiAddDataSourceToFolder(id, folder.id));
    });
    apiCreateGroup(groupName).then((groupId) => {
      groupId1 = groupId;
      apiAddUserToGroup(groupId1, userEmail);
    });
    cy.apiCreateGranularPermission(
      groupName,
      `${groupName} ds`,
      'datasource',
      { canUse: true, canConfigure: false },
      [],
      true
    );
    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('not.exist');
    cy.apiLogout();

    cy.apiLogin();
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(dsFolderPerm.createCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('be.visible');

    const folderName = `Create Only Folder ${testId}`;
    uiCreateDataSourceFolder(folderName);
    uiVerifyDataSourceFolderExists(folderName);

    cy.apiGetDataSourceFolderId(folderName).then((folderId) => {
      // The Create flag also covers membership: move a data source in, then out.
      dragDataSourceToFolder(dataSourceName, folderName);
      cy.apiGetDataSourceIdsInFolder(folderId).then((ids) => expect(ids).to.have.length(1));
      uiEnsureFolderExpanded(folderName, dataSourceName);
      dragDataSourceToStrayList(dataSourceName);
      cy.apiGetDataSourceIdsInFolder(folderId).then((ids) => expect(ids).to.have.length(0));

      // Move the mouse off the sample data source row so its tooltip does not cover the folder menu.
      cy.get(dsFolder.folderRow(folderName)).realHover();
      cy.contains('.tooltip', 'Sample data source').should('not.exist');

      // Ownership covers delete: the creator can delete their own folder without the delete flag.
      uiOpenFolderMenu(folderId);
      cy.get(dsFolder.folderRenameOption(folderId)).should('exist');
      cy.get(dsFolder.folderDeleteOption(folderId)).should('exist');
      cy.get('body').type('{esc}');
      uiDeleteDataSourceFolder(folderId);
      uiVerifyDataSourceFolderExists(folderName, false);
      uiVerifyDataSourceFolderExists(adminFolderName);
      uiVerifyFolderMenuAbsent(adminFolderId);
      cy.apiLogout();

      cy.apiLogin();
      cy.visit(`/${wsSlug}/workspace-settings/groups`);
      cy.get(groupsSelector.groupLink(groupName)).click();
      cy.get(groupsSelector.permissionsLink).click();
      cy.get(dsFolderPerm.deleteCheckbox).check();
      cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
      cy.apiLogout();

      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();
      uiDeleteDataSourceFolder(adminFolderId);
      uiVerifyDataSourceFolderExists(adminFolderName, false);
    });
  });
});
