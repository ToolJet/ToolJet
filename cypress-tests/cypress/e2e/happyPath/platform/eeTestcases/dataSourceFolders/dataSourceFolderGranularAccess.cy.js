import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  dragDataSourceToFolder,
  dragDataSourceToStrayList,
  openDataSourcesList,
  uiEnsureFolderExpanded,
  uiOpenFolderMenu,
  uiRenameDataSourceFolder,
  uiVerifyDataSourceFolderExists,
} from 'Support/utils/platform/dataSourceFolders';


/**
 * NOT COVERED HERE — the folder -> data source Configure cascade. Proving it needs a subject with
 * no data source access of their own, i.e. an end user, and ToolJet blocks that in both directions
 * (any tier on a DATA_SOURCE_FOLDER grant makes the group builder-level). With a builder instead,
 * the role's own access masks the cascade and the test passes whether it works or not. Owned by
 * server/ee/test/modules/folder-data-sources/e2e/folder-data-source-permissions.spec.ts.
 */
describe('Data Source Folders — Folder Granular Access', () => {
  let workspaceId, wsName, wsSlug;

  const setupFolderAccess = (label, permissions, role = 'builder') => {
    const attemptId = Date.now();
    const folderName = `${label} DS Folder ${attemptId}`;
    const dataSourceName = `ds-${label.toLowerCase()}-${attemptId}`;
    const groupName = `QA ${label} Group ${attemptId}`;
    const userEmail = `ds-folder-${label.toLowerCase().replace(/\s+/g, '-')}-${attemptId}@example.com`;
    let folderId;
    let dataSourceId;

    return cy
      .apiCreateDataSourceFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateGlobalDataSource(dataSourceName);
      })
      .then((createdDataSourceId) => {
        dataSourceId = createdDataSourceId;
        return cy.apiAddDataSourceToFolder(dataSourceId, folderId);
      })
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
      .then(() =>
        cy.apiUpdateGroupPermission(groupName, {
          dataSourceFolderCreate: false,
          dataSourceFolderDelete: false,
        })
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, role, 'password', wsName, {}, [groupName]))
      .then(() => ({ folderId, dataSourceId, folderName, dataSourceName, userEmail, groupName }));
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `ds-folder-granular-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['data_source_folder']);
    // Strip the default builder group before it has members; mid-test updates are rejected.
    cy.apiUpdateGroupPermission('builder', {
      dataSourceFolderCreate: false,
      dataSourceFolderDelete: false,
    });
  });

  // Per the tier's helper text: "Rename the folder, move and edit data sources in the folder" — scoped to the granted folder only.
  it('an Edit folder grant lets the user rename the granted folder and move data sources in and out of it — and nothing else', () => {
    setupFolderAccess('Scoped', {
      canEditFolder: true,
      canEditApps: false,
      canViewApps: false,
    }).then(({ folderId, folderName, dataSourceName, userEmail }) => {
      const strayName = `ds-stray-${Date.now()}`;
      const renamed = `${folderName} Renamed`;

      // A folder the group has no grant on is no longer rendered at all, so there is nothing to open a menu on or drop onto — that scoping is asserted in the Visibility spec instead.
      cy.apiLogin();
      cy.apiCreateGlobalDataSource(strayName);
      cy.then(() => {
        cy.apiLogin(userEmail, 'password');
        openDataSourcesList();

        // Granted folder: Rename is offered and works; Delete stays a coarse right.
        uiOpenFolderMenu(folderId);
        cy.get(dsFolder.folderRenameOption(folderId)).should('exist');
        cy.get(dsFolder.folderDeleteOption(folderId)).should('not.exist');
        cy.get('body').type('{esc}');
        uiRenameDataSourceFolder(folderId, renamed);
        uiVerifyDataSourceFolderExists(renamed);

        // Move a data source OUT of the granted folder, then another one IN.
        uiEnsureFolderExpanded(renamed, dataSourceName);
        dragDataSourceToStrayList(dataSourceName);
        cy.apiGetDataSourceIdsInFolder(folderId).then((ids) => expect(ids).to.be.empty);
        uiVerifyDataSourceFolderExists(renamed);
        cy.get(dsFolder.folderEmptyText(folderId)).should('have.text', 'This folder is empty');

        dragDataSourceToFolder(strayName, renamed);
        cy.apiGetDataSourceIdsInFolder(folderId).then((ids) => expect(ids).to.have.length(1));
      });
    });
  });

  it('a data-source-level grant does not reveal the folder its data source sits in, so that data source is unreachable', () => {
    const attemptId = Date.now();
    const folderName = `DS Grant Folder ${attemptId}`;
    const dataSourceName = `ds-direct-${attemptId}`;
    const groupName = `QA DS Direct ${attemptId}`;
    const userEmail = `ds-direct-${attemptId}@example.com`;

    cy.apiCreateDataSourceFolder(folderName).then((folder) => {
      cy.apiCreateGlobalDataSource(dataSourceName).then((dataSourceId) => {
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id);
        // Remove the builder role's own data source access so the direct grant is the only way in.
        cy.apiDeleteGranularPermission('builder', ['data_source']);
        apiCreateGroup(groupName);
        // formatResources maps 'datasource' resources to { dataSourceId: <value> }, so this must be the ID — passing the name silently creates a grant that matches nothing.
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} ds`,
          'datasource',
          { canUse: true, canConfigure: false },
          [dataSourceId],
          false
        );
        cy.apiFullUserOnboarding('QA Direct', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      });

      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();

      // CURRENT BEHAVIOUR, asserted as-is.
      uiVerifyDataSourceFolderExists(folderName, false);
      cy.get(dsFolder.dataSourceRow(dataSourceName)).should('not.exist');
    });
  });
});
