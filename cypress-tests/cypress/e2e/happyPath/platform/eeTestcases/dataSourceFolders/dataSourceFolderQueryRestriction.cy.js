import { commonSelectors } from 'Selectors/common';
import { dataSourceSelector } from 'Selectors/marketplace/dataSource';
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from 'Selectors/platform/dataSourceFolders';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  apiCreateAppWithQuery,
  openDataSourcesList,
  openGroupGranularAccess,
  uiEnsureFolderExpanded,
  uiOpenEditDataSourceFolderGrant,
  uiRunQueryInBuilder,
  verifyQueryRunAllowed,
  verifyQueryRunBlocked,
} from 'Support/utils/platform/dataSourceFolders';

/** Restrict query run on a data source folder grant. */
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

  /** Folder + data source inside it. */
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

  /** Group with one folder grant. */
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

  it('a restricted data source stays visible and configurable, and the restriction lifts and re-applies on the next run', () => {
    const email = `ds-restricted-${testId}@example.com`;
    const groupName = `QA Restricted Configure ${testId}`;

    /** Toggles Restrict query run through the UI as admin, then hands the session back to the member — so "takes effect on the next run" is proven without a re-login. */
    const adminTogglesRestrict = () => {
      cy.getCookie('tj_auth_token').then((userCookie) => {
        cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
        openGroupGranularAccess(groupName);
        uiOpenEditDataSourceFolderGrant();
        cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).click();
        cy.get(dsFolderPerm.sharedModalConfirmButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission updated successfully');
        cy.then(() => cy.setCookie('tj_auth_token', userCookie.value));
      });
    };

    // Configure must come from the folder grant alone, so the builder role's own data source access is removed while the group still has no members.
    cy.apiDeleteGranularPermission('builder', ['data_source', 'data_source_folder']);

    setupFolder().then(({ folderId, folderName, dataSourceId, dataSourceName }) => {
      createFolderGroup(groupName, folderId, { canEditApps: true, canViewApps: false, canRunQuery: false });
      cy.apiFullUserOnboarding('QA Restricted', email, 'builder', 'password', wsName, {}, [groupName]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateAppWithQuery(`restricted-app-${testId}`, dataSourceId, queryName).then(({ appId }) => {
        // The restriction is narrow: the data source is still listed and still editable.
        cy.apiLogin(email, 'password');
        openDataSourcesList();
        uiEnsureFolderExpanded(folderName, dataSourceName);
        cy.get(dsFolder.dataSourceRow(dataSourceName)).click();
        cy.get(dataSourceSelector.dsNameInputField).should('be.enabled');

        // but running its query is refused.
        cy.openApp('', workspaceId, appId);
        uiRunQueryInBuilder(queryName).then(verifyQueryRunBlocked);

        // Lifted, and it runs again on the very next run.
        adminTogglesRestrict();
        cy.openApp('', workspaceId, appId);
        uiRunQueryInBuilder(queryName).then(verifyQueryRunAllowed);

        // Re-applied, and it is refused again.
        adminTogglesRestrict();
        cy.openApp('', workspaceId, appId);
        uiRunQueryInBuilder(queryName).then(verifyQueryRunBlocked);
      });
    });
  });

});
