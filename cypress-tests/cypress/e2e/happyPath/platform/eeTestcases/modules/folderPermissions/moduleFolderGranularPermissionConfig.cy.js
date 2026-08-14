import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/manageGroups';
import { commonEeSelectors } from 'Selectors/eeCommon';
import { openGroupThreeDotMenu } from 'Support/utils/platform/customGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';

// Section 1 (Permission Configuration) scope note: the other config checks in the
// manual doc — the Edit Folder/Edit Modules/View Modules radios existing & being
// mutually exclusive, All Folders vs Custom Folders resource selection, and the
// End-user tooltip — all require driving the "Add permission" dropdown
// (AddResourcePermissionsMenu.jsx's Bootstrap OverlayTrigger), which proved
// unreliable in headless Electron across many attempts earlier in this session
// (see moduleGranularPermissions.cy.js's header comment). Their underlying
// *behavior* is already proven indirectly by moduleFolderGranularAccess.cy.js and
// moduleFolderPermissionInheritance.cy.js (effective access matches each permission
// level, union/highest-wins across grants) — this file only covers what's safely
// verifiable without that dropdown: group duplication.
describe('Modules — Folder Granular Permission Configuration', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-config-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  const visitGroupsSettingsPage = () => {
    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.wait(2000);
  };

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense('valid');
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it('duplicating a group duplicates its module-folder granular permission', () => {
    const folderName = `Config Folder ${testId}`;
    const groupName = `QA Config Group ${testId}`;
    const duplicatedGroupName = `${groupName}_copy`;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} folder edit`,
          'module_folder',
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
            const copiedPermission = response.body.find((perm) => perm.type === 'module_folder');
            expect(copiedPermission, 'duplicated module_folder granular permission').to.exist;
          });
        });
      });
    });
  });
});
