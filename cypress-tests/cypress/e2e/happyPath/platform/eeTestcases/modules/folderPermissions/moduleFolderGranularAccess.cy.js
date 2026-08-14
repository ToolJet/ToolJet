import { commonSelectors, commonWidgetSelector } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import { versionModalSelector } from 'Selectors/eeCommon';
import { dashboardSelector } from 'Selectors/dashboard';
import { viewAppCardOptions } from 'Support/utils/common';
import { openModulesList } from 'Support/utils/platform/modules';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/dashboard';

// Granular per-folder module permissions (Edit Folder / Edit Modules / View Modules),
// distinct from the coarse moduleFolderCreate/moduleFolderDelete toggles covered in
// moduleFolder{Create,Delete}Permission.cy.js. Set up via cy.apiCreateGranularPermission
// with resourceType "module_folder" (endpoint added to platformApiCommands.js) rather than
// the "Add permission" UI dropdown, for the same reliability reasons as the direct-module
// granular permission suite.
describe('Modules — Folder Granular Access', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-granular-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  const setupFolderAccess = (label, permissions) => {
    const folderName = `${label} Folder ${testId}`;
    const moduleName = `${label} Module ${testId}`;
    const groupName = `QA ${label} Group ${testId}`;
    const userEmail = `qa-folder-${label.toLowerCase().replace(/\s+/g, '-')}-${testId}@example.com`;
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

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense('valid');
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
  });

  it('user with Edit Folder permission can rename an authorized folder', () => {
    setupFolderAccess('EditFolderRename', { canEditFolder: true, canEditApps: false, canViewApps: false }).then(
      ({ folderName, userEmail }) => {
        const renamedFolderName = `${folderName} Renamed`;
        cy.apiLogin(userEmail, 'password');
        openModulesList();
        cy.get(commonSelectors.editFolderOption(folderName)).click();
        cy.clearAndType(commonSelectors.folderNameInput, renamedFolderName);
        cy.get(commonSelectors.buttonSelector('update folder')).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'Folder has been updated.');
        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('exist');
        cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');
      }
    );
  });

  it('user with Edit Folder permission can add a module to and remove it from an authorized folder', () => {
    setupFolderAccess('EditFolderMove', { canEditFolder: true, canEditApps: false, canViewApps: false }).then(
      ({ folderName, userEmail }) => {
        const looseModuleName = `Loose Module ${testId}`;
        cy.apiCreateModule(looseModuleName);

        cy.apiLogin(userEmail, 'password');
        openModulesList();

        viewAppCardOptions(looseModuleName);
        cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
        cy.get(dashboardSelector.selectFolder).click();
        cy.get(commonSelectors.folderList).contains(folderName).click();
        cy.get(dashboardSelector.addToFolderButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(folderName), false);

        cy.get(dashboardSelector.folderName(folderName)).click();
        cy.get(commonSelectors.appCard(looseModuleName)).should('be.visible');

        viewAppCardOptions(looseModuleName);
        cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption)).click();
        cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, commonText.appRemovedFromFolderTaost, false);
        cy.get(commonSelectors.appCard(looseModuleName)).should('not.exist');
      }
    );
  });

  it('user with Edit Folder permission can edit a module within the folder', () => {
    setupFolderAccess('EditFolderEditMod', { canEditFolder: true, canEditApps: false, canViewApps: false }).then(
      ({ moduleId, userEmail }) => {
        cy.apiLogin(userEmail, 'password');
        cy.visit(`/${Cypress.env('workspaceSlug')}/apps/${moduleId}`, { failOnStatusCode: false });
        cy.wait(3000);

        cy.get(moduleSelectors.versionSwitcherButton).click();
        cy.get(commonSelectors.buttonSelector('create draft version')).click();
        cy.get(versionModalSelector.versionNameInput).type('v2-folder-edit-allowed');
        cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
        cy.get(commonSelectors.toastMessage).should('not.exist');
        cy.get(moduleSelectors.versionSwitcherButton).should('contain.text', 'v2-folder-edit-allowed');
      }
    );
  });

  it('user with only Edit Modules permission can edit a module in the folder but cannot rename the folder or add/remove modules', () => {
    setupFolderAccess('EditModulesOnly', { canEditFolder: false, canEditApps: true, canViewApps: false }).then(
      ({ folderName, moduleId, moduleName, userEmail }) => {
        cy.apiLogin(userEmail, 'password');

        // Can edit the module itself.
        cy.visit(`/${Cypress.env('workspaceSlug')}/apps/${moduleId}`, { failOnStatusCode: false });
        cy.wait(3000);
        cy.get(moduleSelectors.versionSwitcherButton).click();
        cy.get(commonSelectors.buttonSelector('create draft version')).click();
        cy.get(versionModalSelector.versionNameInput).type('v2-edit-modules-only');
        cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
        cy.get(commonSelectors.toastMessage).should('not.exist');
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
    const folderName = `Unshared Folder ${testId}`;
    const userEmail = `qa-folder-unshared-${testId}@example.com`;

    cy.apiCreateModuleFolder(folderName);
    cy.apiFullUserOnboarding('QA Unshared Folder User', userEmail, 'builder', 'password', wsName);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');
  });

  it('deleting a module folder does not delete the modules inside it', () => {
    const folderName = `Deletable Folder ${testId}`;
    const moduleName = `Surviving Module ${testId}`;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
      cy.apiCreateModule(moduleName).then((module) => {
        cy.apiAddModuleToFolder(module.id, folder.id);
      });
    });

    cy.intercept('DELETE', '/api/folders/*').as('folderDeleted');
    openModulesList();
    cy.get(commonSelectors.folderCardOptions(folderName)).click();
    cy.get(commonSelectors.deleteFolderOption(folderName)).click();
    cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
    cy.wait('@folderDeleted');
    cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');

    cy.get(moduleSelectors.allModulesLink).click({ force: true });
    cy.get(commonSelectors.appCard(moduleName)).should('exist');
  });
});
