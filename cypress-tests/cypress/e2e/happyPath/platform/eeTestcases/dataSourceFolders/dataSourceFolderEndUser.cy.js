import { commonSelectors } from 'Selectors/common';
import { dataSourceFolderPermissionSelectors as dsFolderPerm } from 'Selectors/platform/dataSourceFolders';
import { groupsSelector } from 'Selectors/platform/manageGroups';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  apiCreateReleasedAppWithQuery,
  openGroupGranularAccess,
  uiAddUserToGroup,
  uiOpenAddDataSourceFolderGrant,
  uiOpenEditDataSourceFolderGrant,
  uiSelectGrantFolders,
  verifyQueryRunAllowed,
  verifyQueryRunBlocked,
  visitReleasedAppAndCaptureQueryRun,
} from 'Support/utils/platform/dataSourceFolders';

/**
 * End users and data source folders.
 *
 * End users can't hold a data source folder TIER (Edit folder / Configure /
 * Build with). The one control that applies to them is Restrict query run,
 * which they meet in released apps.
 */
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

  it('the default End-user group cannot be given data source folder access', () => {
    openGroupGranularAccess('End-user');
    cy.get(groupsSelector.addPermissionButton).click();
    cy.get(dsFolderPerm.addDataSourceFolderButton).should('be.disabled');
    cy.get(dsFolderPerm.addDataSourceFolderButton).realHover();
    cy.contains('.tooltip', 'End-user cannot access data source folders').should('be.visible');
  });

  it('an end user cannot be added to a group that holds a data source folder tier', () => {
    const groupName = `QA Tier Group ${testId}`;
    const email = `ds-enduser-tier-${testId}@example.com`;

    setupFolder().then(({ folderId }) => {
      apiCreateGroup(groupName);
      createGrant(groupName, folderId, { canViewApps: true });
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      cy.visit(`/${wsSlug}/workspace-settings/groups`);
      cy.get(groupsSelector.groupLink(groupName)).click();
      uiAddUserToGroup(email);

      cy.get(commonSelectors.modalComponent).should('contain.text', 'Cannot add an end-user to this group');
      cy.get(commonSelectors.modalComponent).should('contain.text', email);
    });
  });

  it('a group containing an end user offers only Restrict query run, and a restriction-only grant saves', () => {
    const groupName = `QA EndUser Restrict ${testId}`;
    const email = `ds-enduser-restrict-${testId}@example.com`;

    setupFolder().then(({ folderName }) => {
      apiCreateGroup(groupName);
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      openGroupGranularAccess(groupName);
      uiOpenAddDataSourceFolderGrant();

      // Tiers are out of an end user's scope; the restriction is not. (BUG-08)
      cy.get(dsFolderPerm.sharedModalEditFolderRadio).should('be.disabled');
      cy.get(dsFolderPerm.sharedModalConfigureRadio).should('be.disabled');
      cy.get(dsFolderPerm.sharedModalBuildWithRadio).should('be.disabled');
      cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).should('be.enabled');

      // A restriction with no tier is exactly what an end user may hold. (BUG-06)
      cy.get(dsFolderPerm.sharedModalPermissionNameInput).type(`restrict only ${testId}`);
      cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).check();
      uiSelectGrantFolders([folderName]);
      cy.get(dsFolderPerm.sharedModalConfirmButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission created successfully!');
    });
  });

  it('picking a tier on a group that contains an end user is refused with the role-conflict dialog', () => {
    const groupName = `QA EndUser Conflict ${testId}`;
    const email = `ds-enduser-conflict-${testId}@example.com`;

    setupFolder().then(({ folderId }) => {
      // Restriction-only grant first, then the end user joins.
      apiCreateGroup(groupName);
      createGrant(groupName, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      openGroupGranularAccess(groupName);
      uiOpenEditDataSourceFolderGrant();
      cy.get(dsFolderPerm.sharedModalBuildWithRadio).click({ force: true });
      cy.get(dsFolderPerm.sharedModalConfirmButton).click();

      cy.get(commonSelectors.modalComponent).should('contain.text', roleConflictTitle);
      cy.get(commonSelectors.modalComponent).should('contain.text', email);
    });
  });

  it('a restricted end user is blocked in a released app until the restriction is unticked', () => {
    const groupName = `QA EndUser Released ${testId}`;
    const email = `ds-enduser-released-${testId}@example.com`;
    const appName = `enduser-app-${testId}`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      apiCreateGroup(groupName);
      createGrant(groupName, folderId, { canRunQuery: false });
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName, {}, [groupName]);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      apiCreateReleasedAppWithQuery(appName, appName, dataSourceId, queryName).then(() => {
        cy.apiLogin(email, 'password');
        visitReleasedAppAndCaptureQueryRun(appName).then(verifyQueryRunBlocked);

        // Admin lifts the restriction through the UI. (BUG-06)
        cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
        openGroupGranularAccess(groupName);
        uiOpenEditDataSourceFolderGrant();
        cy.get(dsFolderPerm.sharedModalRestrictQueryRunCheckbox).uncheck();
        cy.get(dsFolderPerm.sharedModalConfirmButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'Permission updated successfully');

        cy.apiLogin(email, 'password');
        visitReleasedAppAndCaptureQueryRun(appName).then(verifyQueryRunAllowed);
      });
    });
  });

  it('a released app keeps working for an unrestricted end user as its data source moves between folders', () => {
    const email = `ds-enduser-moves-${testId}@example.com`;
    const appName = `enduser-moves-${testId}`;

    setupFolder().then(({ folderId, dataSourceId }) => {
      cy.apiFullUserOnboarding('QA EndUser', email, 'end-user', 'password', wsName);

      cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
      cy.apiCreateDataSourceFolder(`Other Folder ${testId}`).then((other) => {
        apiCreateReleasedAppWithQuery(appName, appName, dataSourceId, queryName).then(() => {
          const runAsEndUser = () => {
            cy.apiLogin(email, 'password');
            visitReleasedAppAndCaptureQueryRun(appName).then(verifyQueryRunAllowed);
            cy.apiLogin('dev@tooljet.io', 'password', workspaceId);
          };

          runAsEndUser();
          cy.apiAddDataSourceToFolder(dataSourceId, other.id);
          runAsEndUser();
          cy.apiRemoveDataSourceFromFolder(dataSourceId, other.id);
          runAsEndUser();
          cy.apiAddDataSourceToFolder(dataSourceId, folderId);
          runAsEndUser();
        });
      });
    });
  });
});
