import { commonSelectors } from 'Selectors/common';
import { commonEeSelectors } from 'Selectors/platform/eeCommon';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupThreeDotMenu } from 'Support/utils/platform/customGroups';

describe('Apps — Folder Granular Permission Configuration', () => {
  const testId = Date.now();

  let workspaceId, wsName, wsSlug;

  const visitGroupsSettingsPage = () => {
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.wait(2000);
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-config-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  it('duplicating a group duplicates its app-folder granular permission', () => {
    const folderName = `App Config Folder ${testId}`;
    const groupName = `QA App Config Group ${testId}`;
    const duplicatedGroupName = `${groupName}_copy`;

    cy.apiCreateAppFolder(folderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder edit ${testId}`,
          'folder',
          { canEditFolder: true, canEditApps: false, canViewApps: false },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      visitGroupsSettingsPage();
      openGroupThreeDotMenu(groupName);
      cy.get(groupsSelector.duplicateOption).click();
      cy.get(commonEeSelectors.confirmButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, 'Group duplicated successfully');

      cy.apiGetGroupId(duplicatedGroupName).then((duplicatedGroupId) => {
        cy.getAuthHeaders().then((headers) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('server_host')}/api/v2/group-permissions/${duplicatedGroupId}/granular-permissions`,
            headers,
          }).then((response) => {
            expect(response.status).to.equal(200);
            const copiedPermission = response.body.find((perm) => perm.type === 'folder');
            expect(copiedPermission, 'duplicated folder granular permission').to.exist;
          });
        });
      });
    });
  });
});
