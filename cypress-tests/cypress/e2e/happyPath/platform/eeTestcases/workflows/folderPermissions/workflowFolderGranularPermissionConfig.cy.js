import { commonSelectors } from 'Selectors/common';
import { commonEeSelectors } from 'Selectors/platform/eeCommon';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openGroupThreeDotMenu } from 'Support/utils/platform/customGroups';

describe('Workflows — Folder Granular Permission Configuration', () => {
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
    wsName = `wf-folder-config-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  it('duplicating a group duplicates its workflow-folder granular permission', () => {
    const folderName = `Workflow Config Folder ${testId}`;
    const groupName = `QA Workflow Config Group ${testId}`;
    const duplicatedGroupName = `${groupName}_copy`;

    cy.apiCreateWorkflowFolder(folderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder edit ${testId}`,
          'workflow_folder',
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
            const copiedPermission = response.body.find((perm) => perm.type === 'workflow_folder');
            expect(copiedPermission, 'duplicated workflow_folder granular permission').to.exist;
          });
        });
      });
    });
  });
});
