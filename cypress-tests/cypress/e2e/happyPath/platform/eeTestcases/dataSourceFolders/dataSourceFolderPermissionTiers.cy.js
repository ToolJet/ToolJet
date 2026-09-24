import { dataSourceSelector } from 'Selectors/marketplace/dataSource';
import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openDataSourcesList,
  uiEnsureFolderExpanded,
} from 'Support/utils/platform/dataSourceFolders';
import { getGroupPermissionInput } from 'Support/utils/userPermissions';

/**
 * The three data source folder permission tiers, verified where a user meets
 * them: on the data sources page and inside the app builder.
 *
 *   Edit folder  — manage the folder, and everything Configure grants
 *   Configure    — open and edit the connection details of data sources in it
 *   Build with   — use those data sources in an app, WITHOUT editing them
 *
 * Configure is asserted the same way the existing customGroupGranularAccess spec
 * asserts per-data-source Configure: the connection form's name field is enabled
 * for a granted data source and disabled for one the user may only use. Build
 * with is asserted in the query manager, where a usable data source appears as
 * an add-query card.
 */
describe('Data Source Folders — Permission Tiers', () => {
  let workspaceId, wsName, wsSlug;

  /**
   * Folder + data source inside it + a group holding one folder-scoped tier +
   * a builder in that group. The builder role is emptied first so the group's
   * grant is the only privilege in play.
   */
  const setupTier = (label, permissions) => {
    const attemptId = Date.now();
    const folderName = `${label} Tier Folder ${attemptId}`;
    const insideName = `ds-inside-${label.toLowerCase()}-${attemptId}`;
    const outsideName = `ds-outside-${label.toLowerCase()}-${attemptId}`;
    const groupName = `QA ${label} Tier ${attemptId}`;
    const userEmail = `ds-tier-${label.toLowerCase()}-${attemptId}@example.com`;
    let folderId;

    return cy
      .apiCreateDataSourceFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateGlobalDataSource(insideName);
      })
      .then((insideId) => cy.apiAddDataSourceToFolder(insideId, folderId))
      // A data source deliberately left OUTSIDE every folder, so each tier can be
      // shown to reach only the folder's contents.
      .then(() => cy.apiCreateGlobalDataSource(outsideName))
      .then(() => apiCreateGroup(groupName))
      .then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} perm`,
          'data_source_folder',
          permissions,
          [folderId],
          false
        )
      )
      // Emptying the builder role removed its app privileges too, so the group
      // needs both halves back to have an app to build in: the coarse create flag
      // AND a granular app grant, without which the user can create an app but
      // cannot open it and the builder never fetches. Neither is a data source
      // privilege, so the folder grant stays the only data source access.
      // Must precede onboarding: changing a group with members is rejected.
      .then(() => cy.apiUpdateGroupPermission(groupName, { appCreate: true }))
      .then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} apps`,
          'app',
          { canEdit: true, canView: false },
          [],
          true
        )
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, 'builder', 'password', wsName, {}, [groupName]))
      .then(() => ({ folderName, insideName, outsideName, userEmail, folderId }));
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `ds-folder-tiers-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Empty the builder role entirely — every coarse flag and every default
    // granular row — so nothing but the custom group can grant access.
    cy.apiUpdateGroupPermission('builder', getGroupPermissionInput(true, false));
    cy.apiDeleteGranularPermission('builder');
  });

  it('Configure lets the user edit connection details of data sources in the folder, but not outside it', () => {
    setupTier('Configure', {
      canEditFolder: false,
      canEditApps: true,
      canViewApps: false,
    }).then(({ folderName, insideName, outsideName, userEmail }) => {
      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();

      // Inside the folder: the connection form opens and its name field is live.
      uiEnsureFolderExpanded(folderName, insideName);
      cy.get(dsFolder.dataSourceRow(insideName)).click();
      cy.get(dataSourceSelector.dsNameInputField).should('be.enabled');

      // Outside every folder the grant does not reach at all — and the bound is
      // stronger than read-only: with no other data source privilege, the row is
      // not listed. The sidebar is filtered by data source visibility, so an
      // unreachable data source is absent rather than present-and-disabled.
      cy.get(dsFolder.dataSourceRow(outsideName)).should('not.exist');
    });
  });

  it('Build with lets the user use the folder’s data sources in an app without editing them', () => {
    setupTier('BuildWith', {
      canEditFolder: false,
      canEditApps: false,
      canViewApps: true,
    }).then(({ folderName, insideName, outsideName, userEmail }) => {
      const appName = `ds-tier-app-${Date.now()}`;

      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();

      // Build with is the LOWEST tier: usable, never configurable. The connection
      // form must stay read-only even for a data source inside the granted folder.
      uiEnsureFolderExpanded(folderName, insideName);
      cy.get(dsFolder.dataSourceRow(insideName)).click();
      cy.get(dataSourceSelector.dsNameInputField).should('be.disabled');

      // ...but it is offered as a query source inside an app. openApp waits on the
      // empty-canvas label by default, which this app never shows, so wait on the
      // query manager's own card instead.
      cy.apiCreateApp(appName);
      cy.openApp(
        '',
        Cypress.env('workspaceId'),
        Cypress.env('appId'),
        dsFolder.pickerDataSourceCard(insideName)
      );

      // The picker is permission-filtered the same way the sidebar is: the granted
      // folder's data source is offered, the un-foldered one is not.
      cy.get(dsFolder.pickerDataSourceCard(insideName)).should('be.visible');
      cy.get(dsFolder.pickerDataSourceCard(outsideName)).should('not.exist');
    });
  });

  it('Edit folder implies Configure — it manages the folder and edits the data sources inside it', () => {
    setupTier('EditFolder', {
      canEditFolder: true,
      canEditApps: false,
      canViewApps: false,
    }).then(({ folderName, insideName, userEmail }) => {
      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();

      // The tiers cascade: canEditFolder implies the Configure capability below
      // it, so the connection form is editable without Configure being set.
      uiEnsureFolderExpanded(folderName, insideName);
      cy.get(dsFolder.dataSourceRow(insideName)).click();
      cy.get(dataSourceSelector.dsNameInputField).should('be.enabled');
    });
  });
});
