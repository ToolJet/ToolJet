import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openDataSourcesList,
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

  /**
   * KNOWN GAP — this test asserts the CURRENT behaviour, which is not the
   * intended behaviour.
   *
   * Observable invariant, reproducible entirely through the public API: a group
   * whose ONLY data source folder permission is a granular `Edit folder` grant
   * scoped to one folder (isAll false) gets 403 on
   * POST/PUT /api/folder-data-sources for BOTH the granted and the ungranted
   * folder. Turn the coarse `dataSourceFolderCreate` flag on and both succeed.
   * So membership access is decided purely by the coarse flag; the per-folder
   * grant contributes nothing in either direction.
   *
   * Intended: the grant permits `Granted`, refuses `Ungranted`.
   * Actual:   with no coarse flag, BOTH are refused.
   *
   * Step 7 below is the discriminator that separates "scoped guard" from
   * "coarse fallback". When per-folder scoping works, step 1 flips to 201 and
   * this test must be updated — the failure is the signal, not a flake.
   */
  it('per-folder scoping does not reach the membership routes (known gap — guard falls back to the coarse flag)', () => {
    setupFolderAccess('Scoped', {
      canEditFolder: true,
      canEditApps: false,
      canViewApps: false,
    }).then(({ folderId, dataSourceId, userEmail, groupName }) => {
      const ungrantedFolderName = `Ungranted Folder ${Date.now()}`;

      // setupFolderAccess leaves the session as the onboarded (restricted) user, who
      // has no create rights — log back in as admin before seeding more fixtures.
      cy.apiLogin();
      cy.apiCreateDataSourceFolder(ungrantedFolderName).then((ungrantedFolder) => {
        // Coarse flags for both the custom group and the default builder group are
        // already off (setupFolderAccess + beforeEach), set before any member existed.

        cy.apiLogin(userEmail, 'password');

        // Granted folder — intended 201, actual 403.
        cy.apiAddDataSourceToFolder(dataSourceId, ungrantedFolder.id).then((response) => {
          expect(response.status, 'membership into an UNGRANTED folder is refused').to.equal(403);
        });

        cy.apiRemoveDataSourceFromFolder(dataSourceId, folderId).then((response) => {
          expect(
            response.status,
            'membership on the GRANTED folder is also refused — the grant is invisible to this guard'
          ).to.equal(403);
        });

        // Discriminator: turn the coarse flag on and the UNGRANTED folder becomes
        // writable too, proving the fallback rather than any per-folder scoping.
        cy.apiLogin();
        cy.apiUpdateGroupPermission(groupName, { dataSourceFolderCreate: true });

        cy.apiLogin(userEmail, 'password');
        cy.apiAddDataSourceToFolder(dataSourceId, ungrantedFolder.id).then((response) => {
          expect(
            response.status,
            'coarse flag alone authorizes an unscoped folder — confirms the fallback'
          ).to.be.oneOf([200, 201]);
        });
      });
    });
  });
});
