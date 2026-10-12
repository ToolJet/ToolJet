import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { versionModalSelector } from 'Selectors/platform/eeCommon';
import { versionSwitcherSelectors } from 'Selectors/platform/version';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openAppEditor,
  openAppsDashboard,
  openEditorExpectingRestricted,
} from 'Support/utils/platform/folderPermissions';

describe('Apps — Folder Permission Inheritance & Aggregation', () => {
  let workspaceId, wsName, wsSlug;

  const attemptCreateDraft = (versionName) => {
    cy.get(versionSwitcherSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('create draft version')).click();
    cy.get(versionModalSelector.versionNameInput).type(versionName);
    cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-inherit-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['app', 'folder']);
  });

  it('a folder Edit Apps grant gives edit access even when the direct app grant is View-only', () => {
    const attemptId = Date.now();
    const folderName = `App Inherit Folder ${attemptId}`;
    const appName = `Inherit App ${attemptId}`;
    const groupName = `QA App Inherit Group ${attemptId}`;
    const userEmail = `qa-app-inherit-union-${attemptId}@example.com`;
    let appId;

    cy.apiCreateAppFolder(folderName).then((folder) => {
      cy.apiCreateApp(appName).then(() => {
        appId = Cypress.env('appId');
        cy.apiAddAppToFolder(folder.id, appId);
      });

      apiCreateGroup(groupName).then(() => {
        cy.apiCreateGranularPermission(
          groupName,
          `direct view ${attemptId}`,
          'app',
          { canEdit: false, canView: true },
          [],
          true
        ).then(() =>
          cy.apiCreateGranularPermission(
            groupName,
            `folder edit ${attemptId}`,
            'folder',
            { canEditFolder: false, canEditApps: true, canViewApps: false },
            [folder.id],
            false
          )
        );
      });
    });

    cy.then(() => {
      // "Create draft version" only renders once a saved version exists
      // (VersionManagerDropdown.jsx: showCreateDraftButton = savedVersions.length > 0).
      cy.apiGetEditingVersionId(appId).then((versionId) => {
        Cypress.env('appId', appId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA App Inherit Union User', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      cy.apiLogin(userEmail, 'password');
      openAppEditor(wsSlug, appId);
      attemptCreateDraft('v2-union-wins');
      cy.get(commonSelectors.toastMessage).should('not.exist');
      cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', 'v2-union-wins');
    });
  });

  it('a user in multiple groups gets the highest applicable app folder permission', () => {
    const attemptId = Date.now();
    const folderName = `App Multigroup Folder ${attemptId}`;
    const appName = `Multigroup App ${attemptId}`;
    const viewGroupName = `QA App Multigroup View ${attemptId}`;
    const editGroupName = `QA App Multigroup Edit ${attemptId}`;
    const userEmail = `qa-app-inherit-multigroup-${attemptId}@example.com`;
    let appId;

    cy.apiCreateAppFolder(folderName).then((folder) => {
      cy.apiCreateApp(appName).then(() => {
        appId = Cypress.env('appId');
        cy.apiAddAppToFolder(folder.id, appId);
      });

      apiCreateGroup(viewGroupName).then(() =>
        cy.apiCreateGranularPermission(
          viewGroupName,
          `folder view ${attemptId}`,
          'folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
      apiCreateGroup(editGroupName).then(() =>
        cy.apiCreateGranularPermission(
          editGroupName,
          `folder edit ${attemptId}`,
          'folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      cy.apiGetEditingVersionId(appId).then((versionId) => {
        Cypress.env('appId', appId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA App Multigroup User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      openAppEditor(wsSlug, appId);
      attemptCreateDraft('v2-highest-wins');
      cy.get(commonSelectors.toastMessage).should('not.exist');
      cy.get(versionSwitcherSelectors.versionSwitcherButton).should('contain.text', 'v2-highest-wins');
    });
  });

  it("removing a user from the group granting Edit access reduces them to the remaining group's View-only access", () => {
    const attemptId = Date.now();
    const folderName = `App Regress Folder ${attemptId}`;
    const appName = `Regress App ${attemptId}`;
    const viewGroupName = `QA App Regress View ${attemptId}`;
    const editGroupName = `QA App Regress Edit ${attemptId}`;
    const userEmail = `qa-app-inherit-regress-${attemptId}@example.com`;
    let appId;
    let editGroupId;

    cy.apiCreateAppFolder(folderName).then((folder) => {
      cy.apiCreateApp(appName).then(() => {
        appId = Cypress.env('appId');
        cy.apiAddAppToFolder(folder.id, appId);
      });

      apiCreateGroup(viewGroupName).then(() =>
        cy.apiCreateGranularPermission(
          viewGroupName,
          `folder view ${attemptId}`,
          'folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
      apiCreateGroup(editGroupName).then((groupId) => {
        editGroupId = groupId;
        return cy.apiCreateGranularPermission(
          editGroupName,
          `folder edit ${attemptId}`,
          'folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folder.id],
          false
        );
      });
    });

    cy.then(() => {
      cy.apiGetEditingVersionId(appId).then((versionId) => {
        Cypress.env('appId', appId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA App Regress User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);
      cy.apiLogin();
      cy.apiRemoveUserFromGroup(editGroupId, userEmail);

      cy.apiLogin(userEmail, 'password');

      // The /apps/:id route is the editor and is edit-gated, so what's left after
      // the Edit grant goes away is not a read-only editor — it's the restricted
      // page, which points the viewer at /applications instead.
      openEditorExpectingRestricted(wsSlug, appId);

      // View access itself survives: the folder and the app inside it are still
      // listed on the dashboard, which the other group's canViewApps grant allows.
      openAppsDashboard();
      cy.get(dashboardSelector.folderName(folderName)).click();
      cy.get(commonSelectors.appCard(appName)).should('be.visible');
    });
  });
});
