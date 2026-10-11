import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from 'Selectors/platform/dataSourceFolders';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { verifyGranularPermissionModalUI } from 'Support/utils/platform/groupsUI';
import {
  openDataSourcesList,
  openGroupGranularAccess,
  uiOpenAddDataSourceFolderGrant,
  uiOpenEditDataSourceFolderGrant,
  uiSelectGrantFolders,
} from 'Support/utils/platform/dataSourceFolders';

/**
 * UI-only validation for the data source folder permission surfaces.
 *
 * The behaviour behind these controls is covered elsewhere in this directory —
 * here we only assert that the controls exist, read correctly, and gate each
 * other as designed. Modal copy is asserted through the shared
 * verifyGranularPermissionModalUI helper, which now carries a
 * `data_source_folder` branch alongside app / workflow / datasource.
 */
describe('Data Source Folders — Permission and Modal UI', () => {
  let workspaceId, testId, wsName, wsSlug;

  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-ui-${testId}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it('the granular access page exposes the data source folder resource with its four controls', () => {
    const groupName = `QA DS UI Group ${testId}`;

    apiCreateGroup(groupName);
    cy.apiCreateDataSourceFolder(`UI Folder ${testId}`);

    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.granularLink).click();

    // Data source folders is offered as its own resource type, separate from
    // both "Data sources" and "App folders".
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(dsFolderPerm.addDataSourceFolderButton).should('be.visible').click();

    // Labels, helper texts and the Coming Soon environment block.
    verifyGranularPermissionModalUI('data_source_folder');

    // Data source folders open with NO tier pre-selected — initialPermissionState
    // is canEditFolder/canEditApps/canViewApps all false. App folders differ here,
    // defaulting to Edit folder, so this is a deliberate per-resource difference.
    cy.get(dsFolderPerm.sharedModalEditFolderRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalConfigureRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('not.be.checked');

    // The three tiers are a single-select radio group; the fourth control is an
    // independent checkbox and must not be cleared by picking a tier.
    cy.get(dsFolderPerm.sharedModalEditFolderRadio).click();
    cy.get(dsFolderPerm.sharedModalEditFolderRadio).should('be.checked');
    cy.get(dsFolderPerm.sharedModalConfigureRadio).click();
    cy.get(dsFolderPerm.sharedModalConfigureRadio).should('be.checked');
    cy.get(dsFolderPerm.sharedModalEditFolderRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).click();
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('be.checked');
    cy.get(dsFolderPerm.sharedModalConfigureRadio).should('not.be.checked');

    // A selected tier can be cleared by clicking it again, leaving no tier at all.
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).click();
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalEditFolderRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalConfigureRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).click();

    // Restrict query run defaults to UNCHECKED, which means unrestricted — the
    // control is rendered inverted against the underlying canRunQuery flag.
    cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).check();
    cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).should('be.checked');
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('be.checked');

    // The inert Environment block is asserted in the helper above (container,
    // label, "Coming Soon" chip). The select itself cannot be asserted: its
    // data-cy="environment-select" is passed as a PROP to EnvironmentSelect, a
    // react-select wrapper that does not forward unknown props to the DOM, so the
    // attribute never reaches the page. See the selector file note.

    cy.get(dsFolder.cancelButton).click();
  });

  it('the coarse Permissions tab lists data source folders with its own create and delete controls', () => {
    const groupName = `QA DS Coarse UI ${testId}`;

    apiCreateGroup(groupName);

    cy.visit(`/${wsSlug}/workspace-settings/groups`);
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();

    // EE splits create and delete into separate controls; CE collapses them into
    // a single CRUD checkbox, so this row is edition-shaped.
    // The permissions table scrolls; the data source folder row sits below the fold.
    cy.get(dsFolderPerm.resourceRow).scrollIntoView().should('be.visible');
    cy.get(dsFolderPerm.createCheckbox).should('exist').and('not.be.checked');
    cy.get(dsFolderPerm.deleteCheckbox).should('exist').and('not.be.checked');
  });

  it('the folder create and rename modals validate the name and gate their submit buttons', () => {
    const folderName = `Modal Folder ${testId}`;

    openDataSourcesList();

    // Create modal — submit stays disabled until a valid name is present.
    cy.get(dsFolder.createFolderIcon).click();
    cy.get(dsFolder.folderNameInput).should('be.visible');
    cy.get(dsFolder.createFolderButton).should('be.disabled');

    // Whitespace only is treated as empty.
    cy.get(dsFolder.folderNameInput).type('    ');
    cy.get(dsFolder.folderNameError).should('have.text', "Folder name can't be empty");
    cy.get(dsFolder.createFolderButton).should('be.disabled');

    // Special characters are refused inline.
    cy.clearAndType(dsFolder.folderNameInput, 'qa<>/|');
    cy.get(dsFolder.folderNameError).should('have.text', 'Special characters are not accepted.');
    cy.get(dsFolder.createFolderButton).should('be.disabled');

    // The input is capped at 50 characters, the same limit app folders use.
    cy.clearAndType(dsFolder.folderNameInput, 'a'.repeat(51));
    cy.get(dsFolder.folderNameInput).invoke('val').should('have.length', 50);
    cy.get(dsFolder.createFolderButton).should('not.be.disabled');

    // Outer spaces are trimmed and inner runs collapsed before the name is sent.
    cy.intercept('POST', '/api/folders').as('createFolder');
    cy.clearAndType(dsFolder.folderNameInput, `  Modal   Folder  ${testId}  `);
    cy.get(dsFolder.createFolderButton).should('not.be.disabled').click();
    cy.wait('@createFolder').its('request.body.name').should('equal', folderName);
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Folder created successfully!');

    // A duplicate name is refused by the server and surfaced as a toast.
    cy.get(dsFolder.createFolderIcon).click();
    cy.clearAndType(dsFolder.folderNameInput, folderName);
    cy.get(dsFolder.createFolderButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'This folder name is already taken.');
    cy.get(dsFolder.cancelButton).click();

    cy.apiGetDataSourceFolderId(folderName).then((folderId) => {
      // Rename modal — pre-filled, and submit is disabled while the name is
      // UNCHANGED, which is a distinct rule from the create modal's empty check.
      cy.get(dsFolder.folderMenuButton(folderId)).click({ force: true });
      cy.get(dsFolder.folderRenameOption(folderId)).click();
      cy.get(dsFolder.folderNameInput).should('have.value', folderName);
      cy.get(dsFolder.renameFolderButton).should('be.disabled');

      cy.clearAndType(dsFolder.folderNameInput, `${folderName} Edited`);
      cy.get(dsFolder.renameFolderButton).should('not.be.disabled');

      // Changing it back — even with extra spaces — counts as unchanged again.
      cy.clearAndType(dsFolder.folderNameInput, `  ${folderName}  `);
      cy.get(dsFolder.renameFolderButton).should('be.disabled');
      cy.clearAndType(dsFolder.folderNameInput, `${folderName} Edited`);

      // Cancel discards — the folder keeps its original name.
      cy.get(dsFolder.cancelButton).click();
      cy.get(dsFolder.folderRow(folderName)).should('exist');
      cy.get(dsFolder.folderRow(`${folderName} Edited`)).should('not.exist');
    });
  });

  it('a grant name is required — whitespace-only counts as empty — and is capped at 50 characters', () => {
    const groupName = `QA DS Grant Name ${testId}`;

    apiCreateGroup(groupName);
    openGroupGranularAccess(groupName);
    uiOpenAddDataSourceFolderGrant();
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).click();

    // Capped at 50 characters.
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).type('a'.repeat(51));
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).invoke('val').should('have.length', 50);

    // Empty and whitespace-only both keep Add disabled.
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).clear();
    cy.get(dsFolderPerm.sharedModalConfirmButton).should('be.disabled');
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).type('   ');
    cy.get(dsFolderPerm.sharedModalConfirmButton).should('be.disabled');
    cy.get(dsFolder.cancelButton).click();
  });

  it('a Custom grant needs a folder, and a saved scoped grant can be switched to All', () => {
    const groupName = `QA DS Grant Scope ${testId}`;
    const folderName = `Grant Scope Folder ${testId}`;
    const grantName = `scoped ${testId}`;

    apiCreateGroup(groupName);
    cy.apiCreateDataSourceFolder(folderName);

    openGroupGranularAccess(groupName);
    uiOpenAddDataSourceFolderGrant();
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).click();

    // Custom scope with no folder picked cannot be saved.
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).type(grantName);
    cy.get(dsFolderPerm.sharedModalCustomRadio).check();
    cy.get(dsFolderPerm.sharedModalConfirmButton).should('be.disabled');

    // Pick the folder and save the scoped grant.
    uiSelectGrantFolders([folderName]);
    cy.get(dsFolderPerm.sharedModalConfirmButton).should('not.be.disabled').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission created successfully!');

    // Reopen: Custom is kept with the folder, then switch the grant to All.
    uiOpenEditDataSourceFolderGrant();
    cy.get(dsFolderPerm.sharedModalCustomRadio).should('be.checked');
    cy.get(dsFolderPerm.sharedModalSelectedResource).should('contain.text', folderName);
    cy.get(dsFolderPerm.sharedModalAllResourcesRadio).check();
    cy.get(dsFolderPerm.sharedModalConfirmButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission updated successfully');

    uiOpenEditDataSourceFolderGrant();
    cy.get(dsFolderPerm.sharedModalAllResourcesRadio).should('be.checked');
    cy.get(dsFolder.cancelButton).click();
  });
});
