import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from 'Selectors/platform/dataSourceFolders';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { verifyGranularPermissionModalUI } from 'Support/utils/platform/groupsUI';
import { openDataSourcesList } from 'Support/utils/platform/dataSourceFolders';

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

  it('the folder create and rename modals gate their submit buttons', () => {
    const folderName = `Modal Folder ${testId}`;

    openDataSourcesList();

    // Create modal — submit stays disabled until a name is present.
    cy.get(dsFolder.createFolderIcon).click();
    cy.get(dsFolder.folderNameInput).should('be.visible');
    cy.get(dsFolder.createFolderButton).should('be.disabled');
    cy.clearAndType(dsFolder.folderNameInput, folderName);
    cy.get(dsFolder.createFolderButton).should('not.be.disabled').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Folder created successfully!');

    cy.apiGetDataSourceFolderId(folderName).then((folderId) => {
      // Rename modal — pre-filled, and submit is disabled while the name is
      // UNCHANGED, which is a distinct rule from the create modal's empty check.
      cy.get(dsFolder.folderMenuButton(folderId)).click({ force: true });
      cy.get(dsFolder.folderRenameOption(folderId)).click();
      cy.get(dsFolder.folderNameInput).should('have.value', folderName);
      cy.get(dsFolder.renameFolderButton).should('be.disabled');

      cy.clearAndType(dsFolder.folderNameInput, `${folderName} Edited`);
      cy.get(dsFolder.renameFolderButton).should('not.be.disabled');

      // Cancel discards — the folder keeps its original name.
      cy.get(dsFolder.cancelButton).click();
      cy.get(dsFolder.folderRow(folderName)).should('exist');
      cy.get(dsFolder.folderRow(`${folderName} Edited`)).should('not.exist');
    });
  });
});
