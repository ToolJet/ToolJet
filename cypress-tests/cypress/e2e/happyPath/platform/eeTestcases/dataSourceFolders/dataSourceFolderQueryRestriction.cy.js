import { commonSelectors } from 'Selectors/common';
import { dataSourceSelector } from 'Selectors/marketplace/dataSource';
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from 'Selectors/platform/dataSourceFolders';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  apiCreateAppWithQuery,
  apiCreateReleasedAppWithQuery,
  openDataSourcesList,
  openGroupGranularAccess,
  uiEnsureFolderExpanded,
  uiOpenEditDataSourceFolderGrant,
  uiRunQueryInBuilder,
  verifyQueryRunAllowed,
  verifyQueryRunBlocked,
  visitReleasedAppAndCaptureQueryRun,
} from 'Support/utils/platform/dataSourceFolders';

/**
 * Restrict query run on a data source folder grant.
 *
 * The builder role keeps its defaults here on purpose: they allow query runs, and
 * the restriction is deny-biased, so a restricting custom group must still win.
 * A blocked run answers HTTP 201 with the refusal in the body — see
 * verifyQueryRunBlocked.
 */
describe('Data Source Folders — Restrict Query Run', () => {
  let workspaceId, wsName, wsSlug, testId;
  const queryName = 'folderquery';

  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-restrict-${testId}`;
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

  /** Folder + data source inside it. Yields { folderId, dataSourceId, dataSourceName }. */
  const setupFolder = () => {
    const folderName = `Restrict Folder ${testId}`;
    const dataSourceName = `ds-restrict-${testId}`;
    let folderId;
    return cy
      .apiCreateDataSourceFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateGlobalDataSource(dataSourceName);
      })
      .then((dataSourceId) =>
        cy.apiAddDataSourceToFolder(dataSourceId, folderId).then(() => ({ folderId, folderName, dataSourceId, dataSourceName }))
      );
  };

  /** Group with one folder grant. Must be created before the group has members. */
  const createFolderGroup = (groupName, folderId, permissions) => {
    apiCreateGroup(groupName);
    return cy.apiCreateGranularPermission(
      groupName,
      `${groupName} perm`,
      'data_source_folder',
      { canEditFolder: false, canEditApps: false, canViewApps: true, canRunQuery: true, ...permissions },
      [folderId],
      false
    );
  };

  const runAs = (email, appId) => {
    cy.apiLogin(email, 'password');
    cy.openApp('', workspaceId, appId);
    return uiRunQueryInBuilder(queryName);
  };

  it('restricting query run blocks the group’s members in the builder and leaves everyone else unaffected', () => {
    const restrictedEmail = `ds-restricted-${testId}@example.com`;
    const otherEmail = `ds-unrestricted-${testId}@example.com`;
    const groupName = `QA Restricted ${testId}`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      createFolderGroup(groupName, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA Restricted', restrictedEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiFullUserOnboarding('QA Other', otherEmail, 'builder', 'password', wsName);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateAppWithQuery(`restrict-app-${testId}`, dataSourceId, queryName).then(({ appId }) => {
        // The query may exist and be opened — only running it is refused.
        runAs(restrictedEmail, appId).then(verifyQueryRunBlocked);
        runAs(otherEmail, appId).then(verifyQueryRunAllowed);
      });
    });
  });

  it('the restriction is deny-biased — a permissive grant from another group does not lift it', () => {
    const email = `ds-denybias-${testId}@example.com`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      createFolderGroup(`QA Permit ${testId}`, folderId, { canRunQuery: true });
      createFolderGroup(`QA Restrict ${testId}`, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA DenyBias', email, 'builder', 'password', wsName, {}, [
        `QA Permit ${testId}`,
        `QA Restrict ${testId}`,
      ]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateAppWithQuery(`denybias-app-${testId}`, dataSourceId, queryName).then(({ appId }) => {
        runAs(email, appId).then(verifyQueryRunBlocked);
      });
    });
  });

  it('admins are exempt from the restriction even as members of a restricting group', () => {
    const groupName = `QA Admin Restrict ${testId}`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      createFolderGroup(groupName, folderId, { canRunQuery: false });
      cy.apiGetGroupId(groupName).then((groupId) => apiAddUserToGroup(groupId, 'dev@tooljet.io'));

      apiCreateAppWithQuery(`admin-app-${testId}`, dataSourceId, queryName).then(({ appId }) => {
        runAs('dev@tooljet.io', appId).then(verifyQueryRunAllowed);
      });
    });
  });

  it('unticking and re-ticking Restrict query run takes effect on the member’s next run', () => {
    const email = `ds-toggle-${testId}@example.com`;
    const groupName = `QA Toggle ${testId}`;

    const toggleRestrictInUi = () => {
      cy.getCookie('tj_auth_token').then((userCookie) => {
        cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
        openGroupGranularAccess(groupName);
        uiOpenEditDataSourceFolderGrant();
        cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).click();
        cy.get(dsFolderPerm.sharedModalConfirmButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission updated successfully');
        // Back to the member's own session — no re-login.
        cy.then(() => cy.setCookie('tj_auth_token', userCookie.value));
      });
    };

    setupFolder().then(({ folderId, dataSourceId }) => {
      createFolderGroup(groupName, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA Toggle', email, 'builder', 'password', wsName, {}, [groupName]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateAppWithQuery(`toggle-app-${testId}`, dataSourceId, queryName).then(({ appId }) => {
        runAs(email, appId).then(verifyQueryRunBlocked);

        toggleRestrictInUi();
        cy.openApp('', workspaceId, appId);
        uiRunQueryInBuilder(queryName).then(verifyQueryRunAllowed);

        toggleRestrictInUi();
        cy.openApp('', workspaceId, appId);
        uiRunQueryInBuilder(queryName).then(verifyQueryRunBlocked);
      });
    });
  });

  it('a restricted data source stays visible and configurable — only running its queries is refused', () => {
    const email = `ds-configure-restricted-${testId}@example.com`;
    const groupName = `QA Configure Restricted ${testId}`;

    // Configure must come from the folder grant alone, so the builder role's own
    // data source access is removed while it still has no members.
    cy.apiDeleteGranularPermission('builder', ['data_source', 'data_source_folder']);

    setupFolder().then(({ folderId, folderName, dataSourceId, dataSourceName }) => {
      createFolderGroup(groupName, folderId, { canEditApps: true, canViewApps: false, canRunQuery: false });
      cy.apiFullUserOnboarding('QA ConfRestricted', email, 'builder', 'password', wsName, {}, [groupName]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateAppWithQuery(`configure-app-${testId}`, dataSourceId, queryName).then(({ appId }) => {
        cy.apiLogin(email, 'password');
        openDataSourcesList();
        uiEnsureFolderExpanded(folderName, dataSourceName);
        cy.get(dsFolder.dataSourceRow(dataSourceName)).click();
        cy.get(dataSourceSelector.dsNameInputField).should('be.enabled');

        cy.openApp('', workspaceId, appId);
        uiRunQueryInBuilder(queryName).then(verifyQueryRunBlocked);
      });
    });
  });

  it('the restriction also applies in a released app', () => {
    const restrictedEmail = `ds-released-restricted-${testId}@example.com`;
    const otherEmail = `ds-released-other-${testId}@example.com`;
    const groupName = `QA Released Restrict ${testId}`;
    const appName = `released-app-${testId}`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      createFolderGroup(groupName, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA RelRestricted', restrictedEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiFullUserOnboarding('QA RelOther', otherEmail, 'builder', 'password', wsName);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateReleasedAppWithQuery(appName, appName, dataSourceId, queryName).then(() => {
        cy.apiLogin(restrictedEmail, 'password');
        visitReleasedAppAndCaptureQueryRun(appName).then(verifyQueryRunBlocked);

        cy.apiLogin(otherEmail, 'password');
        visitReleasedAppAndCaptureQueryRun(appName).then(verifyQueryRunAllowed);
      });
    });
  });
});
