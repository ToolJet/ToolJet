import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from 'Selectors/platform/dataSourceFolders';
import { navigateToManageGroups } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openDataSourcesList } from 'Support/utils/platform/dataSourceFolders';
import { groupsText } from 'Texts/platform/manageGroups';

describe('Data Source Folders — Custom Group Create Override', () => {
  let workspaceId, groupId1, testId, wsName, wsSlug;

  // A fresh workspace PER TEST — a describe-scoped name makes the second test
  // POST an already-taken slug and the server answers 409.
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
    cy.apiUpdateGroupPermission('builder', { dataSourceFolderCreate: false });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('custom group with dataSourceFolderCreate OFF blocks the builder from creating a data source folder', () => {
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
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(dsFolderPerm.createCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
    cy.apiLogout();

    // Control reappears.
    cy.apiLogin(userEmail, 'password');
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('be.visible');
  });

  it('app folder permissions do not authorize data source folder creation', () => {
    const groupName = `QA App Folder Only ${testId}`;
    const userEmail = `ds-folder-isolation-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);
    cy.apiLogout();

    cy.apiLogin();
    apiCreateGroup(groupName).then((groupId) => {
      apiAddUserToGroup(groupId, userEmail);
      // Grant the APP folder flags only — these must not leak across resource types.
      cy.apiUpdateGroupPermission(groupName, { folderCreate: true, folderDelete: true });
    });
    cy.apiLogout();

    cy.apiLogin(userEmail, 'password');
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('not.exist');

    // And the API refuses too — the UI is not the only gate.
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('server_host')}/api/folders`,
        headers,
        body: { name: `Leaked Folder ${testId}`, type: 'data_source' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(403);
      });
    });
  });
});
