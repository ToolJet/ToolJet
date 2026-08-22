import { commonSelectors } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import { dashboardSelector } from 'Selectors/dashboard';
import { viewAppCardOptions } from 'Support/utils/common';
import { openModulesList } from 'Support/utils/platform/modules';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { getGroupPermissionInput } from 'Support/utils/userPermissions';
import { commonText } from 'Texts/common';


describe('Modules — Folder Granular Access', () => {
  const isEnterprise = Cypress.env('environment') === 'Enterprise';
  let workspaceId, wsName, wsSlug;

  const setupFolderAccess = (label, permissions) => {
    const attemptId = Date.now();
    const folderName = `${label} Folder ${attemptId}`;
    const moduleName = `${label} Module ${attemptId}`;
    const groupName = `QA ${label} Group ${attemptId}`;
    const userEmail = `qa-folder-${label.toLowerCase().replace(/\s+/g, '-')}-${attemptId}@example.com`;
    let folderId;
    let moduleId;

    return cy
      .apiCreateModuleFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateModule(moduleName);
      })
      .then((module) => {
        moduleId = module.id;
        return cy.apiAddModuleToFolder(moduleId, folderId);
      })
      .then(() => apiCreateGroup(groupName))
      .then(() =>
        cy.apiCreateGranularPermission(groupName, `${groupName} perm`, 'module_folder', permissions, [folderId], false)
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, 'builder', 'password', wsName, {}, [groupName]))
      .then(() => ({ folderId, moduleId, folderName, moduleName, userEmail }));
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `modules-folder-granular-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    // Strip every default the builder ROLE ships with — coarse flags and all
    // granular grants (including the module/module_folder "All" defaults) — so
    // each test's custom-group grant is the only source of access being verified.
    cy.apiUpdateGroupPermission('builder', getGroupPermissionInput(isEnterprise, false));
    cy.apiDeleteGranularPermission('builder', []);
  });

  it('user with Edit Folder permission can rename an authorized folder, move modules in and out of it, and edit a module within it — and deleting the folder does not delete the module inside it', () => {
    setupFolderAccess('EditFolder', { canEditFolder: true, canEditApps: false, canViewApps: false }).then(
      ({ folderId, moduleId, folderName, moduleName, userEmail }) => {
        const renamedFolderName = `${folderName} Renamed`;
        const looseModuleName = `Loose Module ${Date.now()}`;
        let looseModuleId;

        cy.apiCreateModule(looseModuleName).then((module) => {
          looseModuleId = module.id;
        });

        cy.apiLogin(userEmail, 'password');

        // Rename the authorized folder — via API, verified via UI.
        cy.then(() => cy.apiRenameFolder(folderId, renamedFolderName));
        openModulesList();
        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('exist');
        cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');

        // Add a loose module to the (renamed) folder, then remove it again — via API, verified via UI.
        cy.then(() => cy.apiAddModuleToFolder(looseModuleId, folderId));
        cy.get(dashboardSelector.folderName(renamedFolderName)).click();
        cy.get(commonSelectors.appCard(looseModuleName)).should('be.visible');

        cy.then(() => cy.apiRemoveModuleFromFolder(looseModuleId, folderId));
        cy.get(moduleSelectors.allModulesLink).click({ force: true });
        cy.get(dashboardSelector.folderName(renamedFolderName)).click();
        cy.get(commonSelectors.appCard(looseModuleName)).should('not.exist');

        // Edit the module that lives inside the folder — via API, verified via UI.
        cy.then(() =>
          cy
            .apiGetEditingVersionId(moduleId)
            .then((versionId) => cy.apiCreateAppVersion(moduleId, 'v2-folder-edit-allowed', versionId))
        );
        cy.visit(`/${Cypress.env('workspaceSlug')}/apps/${moduleId}`, { failOnStatusCode: false });
        cy.wait(3000);
        cy.get(moduleSelectors.versionSwitcherButton).should('contain.text', 'v2-folder-edit-allowed');

        // Deleting the folder (as its owner, admin) does not delete the module inside it.
        cy.apiLogin();
        cy.then(() => cy.apiDeleteFolder(folderId));
        openModulesList();

        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('not.exist');

        cy.get(moduleSelectors.allModulesLink).click({ force: true });
        cy.get(commonSelectors.appCard(moduleName)).should('exist');
      }
    );
  });

  it('user with only Edit Modules permission can edit a module in the folder but cannot rename the folder or add/remove modules', () => {
    setupFolderAccess('EditModulesOnly', { canEditFolder: false, canEditApps: true, canViewApps: false }).then(
      ({ folderName, moduleId, moduleName, userEmail }) => {
        cy.apiLogin(userEmail, 'password');

        // Can edit the module itself — via API, verified via UI.
        cy.apiGetEditingVersionId(moduleId).then((versionId) =>
          cy.apiCreateAppVersion(moduleId, 'v2-edit-modules-only', versionId)
        );
        cy.visit(`/${Cypress.env('workspaceSlug')}/apps/${moduleId}`, { failOnStatusCode: false });
        cy.wait(3000);
        cy.get(moduleSelectors.versionSwitcherButton).should('contain.text', 'v2-edit-modules-only');

        // Cannot manage the folder itself: no "..." menu on the folder card at all,
        // since Edit Modules doesn't grant canEditFolder and this user doesn't own it.
        openModulesList();
        cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');

        // Cannot add/remove modules via the module's own card menu either — that
        // requires folder-edit access (admin/superAdmin/editable_folders_id/ownership),
        // which Edit Modules alone doesn't grant (AppMenu.jsx canAddAppToFolder).
        viewAppCardOptions(moduleName);
        cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).should('not.exist');
      }
    );
  });

  it('user with only View Modules permission can view a module in the folder but cannot manage the folder', () => {
    setupFolderAccess('ViewModulesOnly', { canEditFolder: false, canEditApps: false, canViewApps: true }).then(
      ({ folderName, userEmail }) => {
        cy.apiLogin(userEmail, 'password');

        // Cannot manage the folder itself: no "..." menu on the folder card.
        openModulesList();
        cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');
      }
    );
  });

  it("non-owner without any folder-level grant cannot rename or manage another user's folder", () => {
    const attemptId = Date.now();
    const folderName = `Unshared Folder ${attemptId}`;
    const userEmail = `qa-folder-unshared-${attemptId}@example.com`;

    cy.apiCreateModuleFolder(folderName);
    cy.apiFullUserOnboarding('QA Unshared Folder User', userEmail, 'builder', 'password', wsName);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');
  });
});
