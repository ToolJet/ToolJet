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
  uiVerifyFolderMenuAbsent,
} from 'Support/utils/platform/dataSourceFolders';


// NOT COVERED HERE — the folder -> data source Configure cascade.
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

      // A folder the group has no grant on is no longer rendered at all, so there is nothing to open a menu on or drop onto, so that scoping is asserted in PermissionTiers.
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

  it('a data-source-level grant reveals the folder its data source sits in, without letting the user manage it', () => {
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

      // Expected to match app, workflow and module folders: the folder is listed because it holds a data source the user can see.
      uiVerifyDataSourceFolderExists(folderName);
      uiVerifyFolderMenuAbsent(folder.id);
      uiEnsureFolderExpanded(folderName, dataSourceName);
      cy.get(dsFolder.dataSourceRow(dataSourceName)).should('be.visible');
    });
  });
});
