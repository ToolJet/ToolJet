import { commonSelectors } from 'Selectors/common';
import {
  dataSourceFolderSelectors as dsFolder,
  dataSourceFolderPermissionSelectors as dsFolderPerm,
} from 'Selectors/platform/dataSourceFolders';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openDataSourcesList,
  openGroupGranularAccess,
  uiOpenAddDataSourceFolderGrant,
  uiOpenEditDataSourceFolderGrant,
  uiSelectGrantFolders,
} from 'Support/utils/platform/dataSourceFolders';
import { verifyGranularPermissionModalUI } from 'Support/utils/platform/groupsUI';

/** UI-only validation for the data source folder permission surfaces. */
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

    // Offered as its own resource type, separate from "Data sources" and "App folders".
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(dsFolderPerm.addDataSourceFolderButton).should('be.visible').click();

    cy.get(dsFolder.modalTitle).should('have.text', 'Add data source folders permissions');
    cy.get(dsFolder.modalCloseButton).should('be.visible');

    // Labels, helper texts and the Coming Soon environment block.
    verifyGranularPermissionModalUI('data_source_folder');

    // Both Resources options carry their own explanatory copy.
    cy.get(dsFolderPerm.sharedModalAllResourcesInfoText).should(
      'have.text',
      'This will select all data source folders in the workspace including any new data source folders created'
    );
    cy.get(dsFolderPerm.sharedModalCustomInfoText).should(
      'have.text',
      'Select specific data source folders you want to add to the group'
    );

    // Opens with NO tier pre-selected (app folders default to Edit folder — deliberate difference).
    cy.get(dsFolderPerm.sharedModalEditFolderRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalConfigureRadio).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('not.be.checked');

    // The three tiers are a single-select radio group.
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

    // e.
    cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).should('not.be.checked');
    cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).check();
    cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).should('be.checked');
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('be.checked');

    // The inert Environment block is asserted in the helper above (container, label, "Coming Soon" chip).

    // Grant NAME rules, in the same open modal: capped at 50, empty blocks the save.
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).type('a'.repeat(51));
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).invoke('val').should('have.length', 50);
    cy.get(dsFolderPerm.sharedModalPermissionNameInput).clear();
    cy.get(dsFolderPerm.sharedModalConfirmButton).should('be.disabled');
    // NOT ASSERTED: a spaces-only name should keep Add disabled but does not (UX-6, filed).

    // The X is a different control from Cancel: it must discard too, leaving no row behind.
    cy.get(dsFolder.modalCloseButton).click();
    cy.get(commonSelectors.modalComponent).should('not.exist');
    cy.get(dsFolderPerm.granularAccessRow).should('not.exist');

    // COARSE tab: EE splits create and delete into two controls (CE collapses them into one).
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(dsFolderPerm.resourceRow).scrollIntoView().should('be.visible');
    cy.get(dsFolderPerm.createCheckbox).should('exist').and('not.be.checked');
    cy.get(dsFolderPerm.deleteCheckbox).should('exist').and('not.be.checked');
  });

  it('the folder create and rename modals validate the name and gate their submit buttons', () => {
    const folderName = `Modal Folder ${testId}`;

    openDataSourcesList();

    // Create modal — submit stays disabled until a valid name is present.
    cy.get(dsFolder.createFolderIcon).click();
    cy.get(dsFolder.modalTitle).should('have.text', 'Create folder');
    cy.get(dsFolder.folderNameInput)
      .should('be.visible')
      .and('have.attr', 'placeholder', dsFolder.folderNamePlaceholder);
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
      // Rename modal — pre-filled; submit is disabled while the name is UNCHANGED, a different rule from the create modal's empty check.
      cy.get(dsFolder.folderMenuButton(folderId)).click({ force: true });
      cy.get(dsFolder.folderRenameOption(folderId)).click();
      cy.get(dsFolder.modalTitle).should('have.text', 'Rename folder');
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

  it('a Custom grant needs a folder, and a saved scoped grant can be switched to All', () => {
    // Deliberately NOT merged into the block above.
    const groupName = `QA DS Grant Scope ${testId}`;
    const folderName = `Grant Scope Folder ${testId}`;
    const grantName = `scoped ${testId}`;

    apiCreateGroup(groupName);
    cy.apiCreateDataSourceFolder(folderName);

    openGroupGranularAccess(groupName);
    uiOpenAddDataSourceFolderGrant();
    cy.get(dsFolderPerm.sharedModalBuildWithRadio).click();

    // Custom with no folder picked cannot be saved.
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
