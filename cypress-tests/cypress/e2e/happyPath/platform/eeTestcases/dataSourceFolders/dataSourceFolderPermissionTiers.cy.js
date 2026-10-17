import { dataSourceSelector } from 'Selectors/marketplace/dataSource';
import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openDataSourcesList,
  uiEnsureFolderExpanded,
} from 'Support/utils/platform/dataSourceFolders';
import { getGroupPermissionInput } from 'Support/utils/userPermissions';

// A data source folder grant has three tiers.
describe('Data Source Folders — Permission Tiers', () => {
  let workspaceId, wsName, wsSlug;

  const TIERS = {
    configure: { canEditFolder: false, canEditApps: true, canViewApps: false },
    buildWith: { canEditFolder: false, canEditApps: false, canViewApps: true },
    editFolder: { canEditFolder: true, canEditApps: false, canViewApps: false },
  };

  // fixture

  // Folder + a data source inside it + one outside every folder + a group holding one tier + a builder in that group.
  const setupTier = (label, permissions, isAll = false) => {
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
      .then(() => cy.apiCreateGlobalDataSource(outsideName))
      .then(() => apiCreateGroup(groupName))
      .then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} perm`,
          'data_source_folder',
          permissions,
          isAll ? [] : [folderId],
          isAll
        )
      )
      // appCreate + an app grant so there is an app to build in.
      .then(() => cy.apiUpdateGroupPermission(groupName, { appCreate: true }))
      .then(() =>
        cy.apiCreateGranularPermission(groupName, `${groupName} apps`, 'app', { canEdit: true, canView: false }, [], true)
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, 'builder', 'password', wsName, {}, [groupName]))
      .then(() => ({ folderName, insideName, outsideName, userEmail, folderId, groupName }));
  };

  // admin-side manipulation

  // Applies an admin change while the test user stays logged in, so "takes effect on the next request" is proven without a re-login.
  const asAdmin = (changes) => {
    cy.getCookie('tj_auth_token').then((userCookie) => {
      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      changes();
      cy.then(() => {
        cy.setCookie('tj_auth_token', userCookie.value);
        Cypress.env('workspaceId', workspaceId);
      });
    });
  };

  // There is no update command for a granular permission, so changing a tier means delete + recreate.
  let swapCount = 0;
  const adminChangesTierTo = (groupName, folderId, permissions, isAll = false) => {
    swapCount += 1;
    asAdmin(() => {
      cy.apiDeleteGranularPermission(groupName, ['data_source_folder']);
      cy.apiCreateGranularPermission(
        groupName,
        `${groupName} perm ${swapCount}`,
        'data_source_folder',
        permissions,
        isAll ? [] : [folderId],
        isAll
      );
    });
  };

  const adminMovesIntoFolder = (dataSourceName, folderId) =>
    asAdmin(() => cy.apiGetDatasourceIds([dataSourceName]).then(([id]) => cy.apiAddDataSourceToFolder(id, folderId)));

  const adminMovesOutOfFolder = (dataSourceName, folderId) =>
    asAdmin(() => cy.apiGetDatasourceIds([dataSourceName]).then(([id]) => cy.apiRemoveDataSourceFromFolder(id, folderId)));

  const adminRemovesFromGroup = (groupName, email) =>
    asAdmin(() => cy.apiGetGroupId(groupName).then((id) => cy.apiRemoveUserFromGroup(id, email)));

  const adminAddsToGroup = (groupName, email) =>
    asAdmin(() => cy.apiGetGroupId(groupName).then((id) => apiAddUserToGroup(id, email)));

  const adminDeletesTheGrant = (groupName) =>
    asAdmin(() => cy.apiDeleteGranularPermission(groupName, ['data_source_folder']));

  // assertions

  const phase = (title) => cy.log(`**— ${title} —**`);

  const openConnectionOf = (folderName, dataSourceName) => {
    openDataSourcesList();
    uiEnsureFolderExpanded(folderName, dataSourceName);
    cy.get(dsFolder.dataSourceRow(dataSourceName)).click();
  };

  const expectConnectionEditable = (folderName, dataSourceName) => {
    openConnectionOf(folderName, dataSourceName);
    cy.get(dataSourceSelector.dsNameInputField).should('be.enabled');
  };

  const expectConnectionReadOnly = (folderName, dataSourceName) => {
    openConnectionOf(folderName, dataSourceName);
    cy.get(dataSourceSelector.dsNameInputField).should('be.disabled');
  };

  const expectListedInFolder = (folderName, dataSourceName) => {
    openDataSourcesList();
    uiEnsureFolderExpanded(folderName, dataSourceName);
    cy.get(dsFolder.dataSourceRow(dataSourceName)).should('be.visible');
  };

  // Unreachable data sources are absent from the sidebar, not rendered disabled.
  const expectNotListed = (dataSourceName) => {
    openDataSourcesList();
    cy.get(dsFolder.dataSourceRow(dataSourceName)).should('not.exist');
  };

  // hooks

  beforeEach(() => {
    wsName = `ds-folder-tiers-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Empty the builder role so only the custom group can grant access.
    cy.apiUpdateGroupPermission('builder', getGroupPermissionInput(true, false));
    cy.apiDeleteGranularPermission('builder');
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  // cases

  describe('what each tier grants', () => {
    it('Configure edits, Build with only uses, and Edit folder implies Configure', () => {
      setupTier('Tiers', TIERS.configure).then(({ folderName, insideName, outsideName, folderId, groupName, userEmail }) => {
        cy.apiLogin(userEmail, 'password');

        phase('Configure: connection details are editable');
        expectConnectionEditable(folderName, insideName);
        expectNotListed(outsideName);

        phase('Build with: usable, never configurable');
        adminChangesTierTo(groupName, folderId, TIERS.buildWith);
        expectConnectionReadOnly(folderName, insideName);
        expectNotListed(outsideName);

        phase('Edit folder: cascades Configure without Configure being set');
        adminChangesTierTo(groupName, folderId, TIERS.editFolder);
        expectConnectionEditable(folderName, insideName);
      });
    });
  });

  describe('where a tier is enforced', () => {
    // Isolated on purpose: the only case that opens an App Builder app, the path that fails intermittently on getAppData.
    it('the app query picker is filtered the same way the sidebar is', () => {
      setupTier('Picker', TIERS.buildWith).then(({ folderName, insideName, outsideName, userEmail }) => {
        cy.apiLogin(userEmail, 'password');
        cy.apiCreateApp(`ds-tier-app-${Date.now()}`);

        // On a NEW app the landing picker renders folders as COLLAPSED headers — the contents are not in the DOM at all until the header is clicked.
        cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), dsFolder.pickerFolderHeader(folderName));

        // The folder is offered as a collapsed header with its contents hidden,
        cy.get(dsFolder.pickerFolderHeader(folderName)).should('be.visible');
        cy.get(dsFolder.pickerDataSourceCard(insideName)).should('not.exist');

        // and expanding it reveals the data source inside.
        cy.get(dsFolder.pickerFolderHeader(folderName)).click();
        cy.get(dsFolder.pickerDataSourceCard(insideName)).should('be.visible');

        // The un-foldered data source is listed as a loose card for users who can reach it; this user cannot, so it is absent entirely.
        cy.get(dsFolder.pickerDataSourceCard(outsideName)).should('not.exist');
      });
    });
  });

  describe('when access changes', () => {
    it('it recalculates on the very next request, however the change was made', () => {
      setupTier('Recalc', TIERS.configure).then(({ folderName, insideName, outsideName, folderId, groupName, userEmail }) => {
        cy.apiLogin(userEmail, 'password');
        expectNotListed(outsideName);

        phase('folder membership: moved in, then back out');
        adminMovesIntoFolder(outsideName, folderId);
        expectConnectionEditable(folderName, outsideName);
        adminMovesOutOfFolder(outsideName, folderId);
        expectNotListed(outsideName);

        phase('group membership: removed, then re-added');
        adminRemovesFromGroup(groupName, userEmail);
        expectNotListed(insideName);
        adminAddsToGroup(groupName, userEmail);
        expectListedInFolder(folderName, insideName);

        phase('grant scope: All folders reaches foldered data sources only');
        adminChangesTierTo(groupName, folderId, TIERS.buildWith, true);
        expectListedInFolder(folderName, insideName);
        expectNotListed(outsideName);

        phase('grant deletion: last, because it leaves the user with nothing');
        adminDeletesTheGrant(groupName);
        expectNotListed(insideName);
      });
    });
  });
});
