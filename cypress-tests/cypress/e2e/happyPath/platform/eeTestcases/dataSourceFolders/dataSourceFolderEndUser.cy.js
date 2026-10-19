import { commonSelectors } from 'Selectors/common';
import { dataSourceFolderPermissionSelectors as dsFolderPerm } from 'Selectors/platform/dataSourceFolders';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import {
  apiCreateReleasedAppWithQuery,
  openGroupGranularAccess,
  uiAddUserToGroup,
  uiOpenEditDataSourceFolderGrant,
  verifyQueryRunAllowed,
  verifyQueryRunBlocked,
  visitReleasedAppAndCaptureQueryRun,
} from 'Support/utils/platform/dataSourceFolders';

describe('Data Source Folders — End User Role', () => {
  let workspaceId, wsName, wsSlug, testId;
  const queryName = 'enduserquery';
  const roleConflictTitle = 'Cannot add this permission to the group';

  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-enduser-${testId}`;
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

  const setupFolder = () => {
    const folderName = `End User Folder ${testId}`;
    const dataSourceName = `ds-enduser-${testId}`;
    let folderId;
    return cy
      .apiCreateDataSourceFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateGlobalDataSource(dataSourceName);
      })
      .then((dataSourceId) =>
        cy.apiAddDataSourceToFolder(dataSourceId, folderId).then(() => ({ folderId, folderName, dataSourceId }))
      );
  };

  const createGrant = (groupName, folderId, permissions) =>
    cy.apiCreateGranularPermission(
      groupName,
      `${groupName} perm`,
      'data_source_folder',
      { canEditFolder: false, canEditApps: false, canViewApps: false, canRunQuery: true, ...permissions },
      [folderId],
      false
    );

  it('data source folder tiers are closed to end users — the default group, the modal controls, and both role-conflict guards', () => {
    const groupName = `QA EndUser Guards ${testId}`;
    const email = `ds-enduser-guards-${testId}@example.com`;

    openGroupGranularAccess('End-user');
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(dsFolderPerm.addDataSourceFolderButton).should('be.disabled');
    cy.get(dsFolderPerm.addDataSourceFolderButton).realHover();
    cy.contains('.tooltip', 'End-user cannot access data source folders').should('be.visible');

    setupFolder().then(({ folderId }) => {
      // Grant first, end user second: a restriction-only grant on a group that already holds an end user is refused.
      apiCreateGroup(groupName);
      createGrant(groupName, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);
      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);

      // Tiers stay enabled on purpose (a group can hold builders too); the server refuses the save and names the end user, which is asserted next.
      openGroupGranularAccess(groupName);
      uiOpenEditDataSourceFolderGrant();
      cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).should('be.enabled');
      cy.get(commonSelectors.cancelButton).click();

      openGroupGranularAccess(groupName);
      uiOpenEditDataSourceFolderGrant();
      cy.get(dsFolderPerm.sharedModalBuildWithRadio).click({ force: true });
      cy.get(dsFolderPerm.sharedModalConfirmButton).click();
      cy.get(commonSelectors.modalComponent).should('contain.text', roleConflictTitle);
      cy.get(commonSelectors.modalComponent).should('contain.text', email);
      cy.get(commonSelectors.cancelButton).click();

      const tieredGroup = `QA Tier Group ${testId}`;
      const outsider = `ds-enduser-tier-${testId}@example.com`;
      apiCreateGroup(tieredGroup);
      createGrant(tieredGroup, folderId, { canViewApps: true });
      cy.apiFullUserOnboarding('QA EndUser2', outsider, 'end-user', 'password', wsName);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      cy.visit(`/${wsSlug}/workspace-settings/groups`);
      cy.get(groupsSelector.groupLink(tieredGroup)).click();
      uiAddUserToGroup(outsider);
      cy.get(commonSelectors.modalComponent).should('contain.text', 'Cannot add an end-user to this group');
      cy.get(commonSelectors.modalComponent).should('contain.text', outsider);
    });
  });

  it('a released app for an end user survives folder churn, and is blocked once the folder is restricted', () => {
    const email = `ds-enduser-moves-${testId}@example.com`;
    const appName = `enduser-moves-${testId}`;
    const groupName = `QA EndUser Restrict ${testId}`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      cy.apiCreateDataSourceFolder(`Other Folder ${testId}`).then((other) => {
        apiCreateReleasedAppWithQuery(appName, appName, dataSourceId, queryName).then(() => {
          const runAsEndUser = (verify) => {
            cy.apiLogin(email, 'password');
            visitReleasedAppAndCaptureQueryRun(appName).then(verify);
            cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
          };

          runAsEndUser(verifyQueryRunAllowed);
          cy.apiAddDataSourceToFolder(dataSourceId, other.id);
          runAsEndUser(verifyQueryRunAllowed);
          cy.apiRemoveDataSourceFromFolder(dataSourceId, other.id);
          runAsEndUser(verifyQueryRunAllowed);
          cy.apiAddDataSourceToFolder(dataSourceId, folderId);
          runAsEndUser(verifyQueryRunAllowed);

          apiCreateGroup(groupName);
          createGrant(groupName, folderId, { canRunQuery: false });
          cy.apiGetGroupId(groupName).then((groupId) => apiAddUserToGroup(groupId, email));
          runAsEndUser(verifyQueryRunBlocked);
        });
      });
    });
  });
});
