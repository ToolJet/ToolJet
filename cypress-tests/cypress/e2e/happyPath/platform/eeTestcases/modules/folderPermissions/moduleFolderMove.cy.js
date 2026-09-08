import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/dashboard';
import { versionModalSelector } from 'Selectors/eeCommon';
import { moduleSelectors } from 'Selectors/platform/modules';
import { viewAppCardOptions } from 'Support/utils/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/dashboard';

describe('Modules — Moving Modules Between Folders', () => {
  let workspaceId, wsName, wsSlug;

  // afterEach(() => {
  //   cy.apiLogin();
  //   cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  // });

  beforeEach(() => {
    wsName = `modules-folder-move-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', ['module', 'module_folder']);
  });

  it('user with Edit Folder access sees only authorized folders in the move picker, and can move a module they can edit into one', () => {

    const attemptId = Date.now();
    const editableFolderName = `Editable Folder ${attemptId}`;
    const inaccessibleFolderName = `Inaccessible Folder ${attemptId}`;
    const moduleName = `Move Source Module ${attemptId}`;
    const groupName = `QA Move Group ${attemptId}`;
    const userEmail = `qa-move-basic-${attemptId}@example.com`;

    cy.apiCreateModuleFolder(inaccessibleFolderName);
    cy.apiCreateModuleFolder(editableFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} folder edit`,
          'module_folder',
          { canEditFolder: true, canEditApps: false, canViewApps: false },
          [folder.id],
          false
        )
      );
    });
    cy.then(() => {
      cy.apiFullUserOnboarding('QA Move Basic User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');
      // Ownership grants edit access on the module itself.
      cy.apiCreateModule(moduleName);

      openModulesList();
      cy.wait(2000);
      viewAppCardOptions(moduleName);
      cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
      cy.get(dashboardSelector.selectFolder).click();

      // The picker only lists folders this user has Edit Folder access to.
      cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
      cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);

      cy.get(commonSelectors.folderList).contains(editableFolderName).click();
      cy.get(dashboardSelector.addToFolderButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(editableFolderName), false);

      cy.get(dashboardSelector.folderName(editableFolderName)).click();
      cy.get(commonSelectors.appCard(moduleName)).should('be.visible');
    });
  });

  it('a module can belong to only one folder — moving it to another folder removes it from the previous one', () => {
    const attemptId = Date.now();
    const sourceFolderName = `Source Folder ${attemptId}`;
    const destFolderName = `Dest Folder ${attemptId}`;
    const moduleName = `Relocating Module ${attemptId}`;
    const groupName = `QA Relocate Group ${attemptId}`;
    const userEmail = `qa-move-relocate-${attemptId}@example.com`;
    let moduleId;
    let destFolderId;

    cy.apiCreateModuleFolder(sourceFolderName).then((sourceFolder) => {
      cy.apiCreateModuleFolder(destFolderName).then((destFolder) => {
        destFolderId = destFolder.id;
        apiCreateGroup(groupName).then(() =>
          cy.apiCreateGranularPermission(
            groupName,
            `${groupName} folder edit`,
            'module_folder',
            { canEditFolder: true, canEditApps: false, canViewApps: false },
            [sourceFolder.id, destFolder.id],
            false
          )
        );

        cy.apiCreateModule(moduleName).then((module) => {
          moduleId = module.id;
          cy.apiAddModuleToFolder(moduleId, sourceFolder.id);
        });
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Relocate User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');

      // Move it into the destination folder — via API, verified via UI.
      cy.then(() => cy.apiAddModuleToFolder(moduleId, destFolderId));

      openModulesList();
      cy.get(dashboardSelector.folderName(destFolderName)).click();
      cy.get(commonSelectors.appCard(moduleName)).should('be.visible');

      cy.get(moduleSelectors.allModulesLink).click({ force: true });
      cy.get(dashboardSelector.folderName(sourceFolderName)).click();
      cy.get(commonSelectors.appCard(moduleName)).should('not.exist');
    });
  });

  it("a module's effective permission recalculates immediately once it's moved into a folder that grants access", () => {
    const attemptId = Date.now();
    const folderName = `Recalc Folder ${attemptId}`;
    const moduleName = `Recalc Module ${attemptId}`;
    const groupName = `QA Recalc Group ${attemptId}`;
    const userEmail = `qa-move-recalc-${attemptId}@example.com`;
    let moduleId;
    let folderId;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
      folderId = folder.id;
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} folder edit`,
          'module_folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folderId],
          false
        )
      );
      cy.apiCreateModule(moduleName).then((module) => {
        moduleId = module.id;
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

      cy.apiFullUserOnboarding('QA Recalc User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      cy.url({ timeout: 15000 }).should('include', '/error/restricted');

      // Move it into the folder (as admin) — no re-login for the test user needed.
      cy.apiLogin();
      cy.apiAddModuleToFolder(moduleId, folderId);

      // After the move: same user, fresh visit, now editable via the folder grant.
      cy.apiLogin(userEmail, 'password');
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      cy.get(moduleSelectors.versionSwitcherButton).click();
      cy.get(commonSelectors.buttonSelector('create draft version')).click();
      cy.get(versionModalSelector.versionNameInput).type('v2-after-move');
      cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
      cy.get(commonSelectors.toastMessage).should('not.exist');
      cy.get(moduleSelectors.versionSwitcherButton).should('contain.text', 'v2-after-move');
    });
  });
});
