import { commonSelectors } from 'Selectors/common';
import { versionModalSelector } from 'Selectors/eeCommon';
import { moduleSelectors } from 'Selectors/platform/modules';
import { apiCreateGroup } from 'Support/utils/manageGroups';


describe('Modules — Folder Permission Inheritance & Aggregation', () => {
  let workspaceId, wsName, wsSlug;

  const attemptCreateDraft = (versionName) => {
    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('create draft version')).click();
    cy.get(versionModalSelector.versionNameInput).type(versionName);
    cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `modules-folder-inherit-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['module', 'module_folder']);
  });

  it('a folder Edit Modules grant gives edit access even when the direct module grant is View-only', () => {
    const attemptId = Date.now();
    const folderName = `Inherit Folder ${attemptId}`;
    const moduleName = `Inherit Module ${attemptId}`;
    const groupName = `QA Inherit Group ${attemptId}`;
    const userEmail = `qa-inherit-union-${attemptId}@example.com`;
    let moduleId;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
      cy.apiCreateModule(moduleName).then((module) => {
        moduleId = module.id;
        cy.apiAddModuleToFolder(moduleId, folder.id);
      });

      apiCreateGroup(groupName).then(() => {
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} direct view`,
          'module',
          { canEdit: false, canView: true },
          [],
          true
        ).then(() =>
          cy.apiCreateGranularPermission(
            groupName,
            `${groupName} folder edit`,
            'module_folder',
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
      cy.apiGetEditingVersionId(moduleId).then((versionId) => {
        Cypress.env('appId', moduleId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA Inherit Union User', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      cy.apiLogin(userEmail, 'password');
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      attemptCreateDraft('v2-union-wins');
      cy.get(commonSelectors.toastMessage).should('not.exist');
      cy.get(moduleSelectors.versionSwitcherButton).should('contain.text', 'v2-union-wins');
    });
  });

  it('a user in multiple groups gets the highest applicable module folder permission', () => {
    const attemptId = Date.now();
    const folderName = `Multigroup Folder ${attemptId}`;
    const moduleName = `Multigroup Module ${attemptId}`;
    const viewGroupName = `QA Multigroup View ${attemptId}`;
    const editGroupName = `QA Multigroup Edit ${attemptId}`;
    const userEmail = `qa-inherit-multigroup-${attemptId}@example.com`;
    let moduleId;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
      cy.apiCreateModule(moduleName).then((module) => {
        moduleId = module.id;
        cy.apiAddModuleToFolder(moduleId, folder.id);
      });

      apiCreateGroup(viewGroupName).then(() =>
        cy.apiCreateGranularPermission(
          viewGroupName,
          `${viewGroupName} folder view`,
          'module_folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
      apiCreateGroup(editGroupName).then(() =>
        cy.apiCreateGranularPermission(
          editGroupName,
          `${editGroupName} folder edit`,
          'module_folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      cy.apiGetEditingVersionId(moduleId).then((versionId) => {
        Cypress.env('appId', moduleId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA Multigroup User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      attemptCreateDraft('v2-highest-wins');
      cy.get(commonSelectors.toastMessage).should('not.exist');
      cy.get(moduleSelectors.versionSwitcherButton).should('contain.text', 'v2-highest-wins');
    });
  });

  it("removing a user from the group granting Edit access reduces them to the remaining group's View-only access", () => {
    const attemptId = Date.now();
    const folderName = `Regress Folder ${attemptId}`;
    const moduleName = `Regress Module ${attemptId}`;
    const viewGroupName = `QA Regress View ${attemptId}`;
    const editGroupName = `QA Regress Edit ${attemptId}`;
    const userEmail = `qa-inherit-regress-${attemptId}@example.com`;
    let moduleId;
    let editGroupId;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
      cy.apiCreateModule(moduleName).then((module) => {
        moduleId = module.id;
        cy.apiAddModuleToFolder(moduleId, folder.id);
      });

      apiCreateGroup(viewGroupName).then(() =>
        cy.apiCreateGranularPermission(
          viewGroupName,
          `${viewGroupName} folder view`,
          'module_folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
      apiCreateGroup(editGroupName).then((groupId) => {
        editGroupId = groupId;
        return cy.apiCreateGranularPermission(
          editGroupName,
          `${editGroupName} folder edit`,
          'module_folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folder.id],
          false
        );
      });
    });

    cy.then(() => {
      cy.apiGetEditingVersionId(moduleId).then((versionId) => {
        Cypress.env('appId', moduleId);
        Cypress.env('editingVersionId', versionId);
        cy.apiPublishDraftVersion('v1');
      });

      cy.apiFullUserOnboarding('QA Regress User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);
      cy.apiLogin();
      cy.apiRemoveUserFromGroup(editGroupId, userEmail);

      cy.apiLogin(userEmail, 'password');
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      // Left with View-only access after the Edit-granting group membership is
      // removed — the create button is pre-disabled, so no toast fires.
      cy.get(moduleSelectors.versionSwitcherButton).click();
      cy.get(commonSelectors.buttonSelector('create draft version')).click();
      cy.get(versionModalSelector.versionNameInput).type('v2-view-only-after-removal');
      cy.get(versionModalSelector.createDraftVersionModal.createButton).should('be.disabled');
    });
  });
});
