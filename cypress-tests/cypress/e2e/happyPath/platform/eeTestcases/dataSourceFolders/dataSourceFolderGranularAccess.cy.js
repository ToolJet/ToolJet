import { commonSelectors } from 'Selectors/common';
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
      ).then(() =>
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
    // Same ordering rule: the default builder group is stripped here, while it has
    // no members yet. Doing it mid-test after apiFullUserOnboarding is rejected.
    cy.apiUpdateGroupPermission('builder', {
      dataSourceFolderCreate: false,
      dataSourceFolderDelete: false,
    });
  });

  /**
   * SKIPPED — not isolatable from Cypress, not a coverage decision.
   *
   * To prove the cascade you need a user with NO data source access of their own.
   * That means an end-user role, but adding an end-user to a group holding a tiered
   * DATA_SOURCE_FOLDER grant is rejected server-side (400 on POST /api/organization-users):
   * any of canEditFolder/canEditApps/canViewApps marks the group builder-level.
   * With a builder instead, the role's own broad data source access masks the cascade
   * and the test passes for the wrong reason.
   *
   * Covered instead by server/test/modules/folder-data-sources/e2e/folder-data-source-permissions.spec.ts
   * ("Configure cascade from a DATA_SOURCE_FOLDER grant"), which seeds users directly
   * and can therefore use end-user role.
   */
  it.skip('an Edit folder grant cascades Configure onto the data sources inside the folder', () => {
    // end-user role: a builder keeps broad data source access of its own, which
    // would mask whether the cascade is doing the work. The server e2e uses
    // end-user users for exactly this reason.
    setupFolderAccess(
      'Cascade',
      { canEditFolder: true, canEditApps: false, canViewApps: false },
      'end-user'
    ).then(({ dataSourceId, userEmail }) => {
      cy.apiLogin(userEmail, 'password');

      // There is no plain GET /api/data-sources/:id — the workspace list endpoint is
      // permission-filtered, so a data source appearing here means the folder grant
      // reached it. (A Configure-vs-Use distinction needs :id/environment/:environmentId,
      // which requires an environment id this suite does not yet resolve.)
      cy.getAuthHeaders().then((headers) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('server_host')}/api/data-sources/${Cypress.env('workspaceId')}`,
          headers,
        }).then((response) => {
          expect(response.status).to.equal(200);
          const visibleIds = response.body.data_sources.map((dataSource) => dataSource.id);
          expect(visibleIds, 'foldered data source is reachable via the folder grant').to.include(dataSourceId);
        });
      });
    });
  });

  /** SKIPPED — same reason as the cascade test above; server e2e owns this. */
  it.skip('the cascade is bounded to foldered data sources — one outside every folder is not reached', () => {
    setupFolderAccess(
      'Bounded',
      { canEditFolder: true, canEditApps: false, canViewApps: false },
      'end-user'
    ).then(({ userEmail }) => {
      const strayName = `ds-outside-${Date.now()}`;

      cy.apiCreateGlobalDataSource(strayName).then((strayId) => {
        cy.apiLogin(userEmail, 'password');

        cy.getAuthHeaders().then((headers) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('server_host')}/api/data-sources/${Cypress.env('workspaceId')}`,
            headers,
          }).then((response) => {
            const visibleIds = response.body.data_sources.map((dataSource) => dataSource.id);
            expect(
              visibleIds,
              'a data source outside every folder is NOT reached by the folder grant'
            ).to.not.include(strayId);
          });
        });
      });
    });
  });

  it("a non-owner without any folder-level grant cannot manage another user's folder", () => {
    const attemptId = Date.now();
    const folderName = `Unshared DS Folder ${attemptId}`;
    const userEmail = `ds-folder-unshared-${attemptId}@example.com`;

    cy.apiCreateDataSourceFolder(folderName).then((folder) => {
      // builder coarse flags are already stripped in beforeEach, before any member exists.
      cy.apiFullUserOnboarding('QA Unshared DS User', userEmail, 'builder', 'password', wsName);

      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();

      // The folder is listed, but it offers this user no management affordance:
      // the ⋮ menu only renders when the viewer can rename OR delete, so its
      // absence is the whole permission signal — and it is what the customer
      // actually experiences.
      uiVerifyDataSourceFolderExists(folderName);
      uiVerifyFolderMenuAbsent(folder.id);
    });
  });

  // Expected flow per the tier's own helper text: "Rename the folder, move and edit
  // data sources in the folder". Scoped to the granted folder only. (BUG-01)
  it('an Edit folder grant lets the user rename the granted folder and move data sources in and out of it — and nothing else', () => {
    setupFolderAccess('Scoped', {
      canEditFolder: true,
      canEditApps: false,
      canViewApps: false,
    }).then(({ folderId, folderName, dataSourceName, userEmail }) => {
      const attemptId = Date.now();
      const ungrantedFolderName = `Ungranted Folder ${attemptId}`;
      const strayName = `ds-stray-${attemptId}`;
      const renamed = `${folderName} Renamed`;

      cy.apiLogin();
      cy.apiCreateGlobalDataSource(strayName);
      cy.apiCreateDataSourceFolder(ungrantedFolderName).then((ungranted) => {
        cy.apiLogin(userEmail, 'password');
        openDataSourcesList();

        // Granted folder: Rename is offered and works; Delete stays a coarse right.
        uiOpenFolderMenu(folderId);
        cy.get(dsFolder.folderRenameOption(folderId)).should('exist');
        cy.get(dsFolder.folderDeleteOption(folderId)).should('not.exist');
        cy.get('body').type('{esc}');
        uiRenameDataSourceFolder(folderId, renamed);
        uiVerifyDataSourceFolderExists(renamed);

        // Move a data source into the granted folder, and one out of it.
        dragDataSourceToFolder(strayName, renamed);
        cy.apiGetDataSourceIdsInFolder(folderId).then((ids) => expect(ids).to.have.length(2));
        uiEnsureFolderExpanded(renamed, dataSourceName);
        dragDataSourceToStrayList(dataSourceName);
        cy.apiGetDataSourceIdsInFolder(folderId).then((ids) => expect(ids).to.have.length(1));

        // Ungranted folder: no management menu, and a drop into it is refused.
        uiVerifyFolderMenuAbsent(ungranted.id);
        dragDataSourceToFolder(dataSourceName, ungrantedFolderName);
        cy.verifyToastMessage(commonSelectors.toastMessage, 'You do not have permission to access this resource');
        cy.apiGetDataSourceIdsInFolder(ungranted.id).then((ids) => expect(ids).to.have.length(0));
      });
    });
  });

  it('a data-source-level grant shows the data source inside its folder but gives no folder management', () => {
    const attemptId = Date.now();
    const folderName = `DS Grant Folder ${attemptId}`;
    const dataSourceName = `ds-direct-${attemptId}`;
    const groupName = `QA DS Direct ${attemptId}`;
    const userEmail = `ds-direct-${attemptId}@example.com`;

    cy.apiCreateDataSourceFolder(folderName).then((folder) => {
      cy.apiCreateGlobalDataSource(dataSourceName).then((dataSourceId) =>
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id)
      );
      // The default builder role reaches every data source by itself; remove that so
      // the direct grant is the only way in.
      cy.apiDeleteGranularPermission('builder', ['data_source']);
      apiCreateGroup(groupName);
      cy.apiCreateGranularPermission(
        groupName,
        `${groupName} ds`,
        'datasource',
        { canUse: true, canConfigure: false },
        [dataSourceName],
        false
      );
      cy.apiFullUserOnboarding('QA Direct', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      cy.apiLogin(userEmail, 'password');
      openDataSourcesList();

      // The folder holding the granted data source is listed with it inside...
      uiEnsureFolderExpanded(folderName, dataSourceName);
      cy.get(dsFolder.dataSourceRow(dataSourceName)).should('be.visible');
      // ...but the grant carries no folder rights: no ⋮ menu at all.
      uiVerifyFolderMenuAbsent(folder.id);
    });
  });
});
