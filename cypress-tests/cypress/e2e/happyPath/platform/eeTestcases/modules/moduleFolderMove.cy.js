import { commonSelectors } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import { versionModalSelector } from 'Selectors/eeCommon';
import { dashboardSelector } from 'Selectors/dashboard';
import { viewAppCardOptions } from 'Support/utils/common';
import { openModulesList } from 'Support/utils/platform/modules';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/dashboard';

describe('Modules — Moving Modules Between Folders', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-move-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

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

  it('a user with Edit Folder access on the target folder can move a module they can edit into it', () => {
    const folderName = `Move Target Folder ${testId}`;
    const moduleName = `Move Source Module ${testId}`;
    const groupName = `QA Move Group ${testId}`;
    const userEmail = `qa-move-basic-${testId}@example.com`;

    cy.apiCreateModuleFolder(folderName).then((folder) => {
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
      viewAppCardOptions(moduleName);
      cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
      cy.get(dashboardSelector.selectFolder).click();
      cy.get(commonSelectors.folderList).contains(folderName).click();
      cy.get(dashboardSelector.addToFolderButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(folderName), false);

      cy.get(dashboardSelector.folderName(folderName)).click();
      cy.get(commonSelectors.appCard(moduleName)).should('be.visible');
    });
  });

  it('the move-to-folder picker only lists folders the user has Edit Folder access to', () => {
    const editableFolderName = `Editable Folder ${testId}`;
    const inaccessibleFolderName = `Inaccessible Folder ${testId}`;
    const moduleName = `Picker Module ${testId}`;
    const groupName = `QA Picker Group ${testId}`;
    const userEmail = `qa-move-picker-${testId}@example.com`;

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
      cy.apiFullUserOnboarding('QA Move Picker User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');
      cy.apiCreateModule(moduleName);

      openModulesList();
      viewAppCardOptions(moduleName);
      cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
      cy.get(dashboardSelector.selectFolder).click();
      cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
      cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);
    });
  });

  it('a module can belong to only one folder — moving it to another folder removes it from the previous one', () => {
    const sourceFolderName = `Source Folder ${testId}`;
    const destFolderName = `Dest Folder ${testId}`;
    const moduleName = `Relocating Module ${testId}`;
    const groupName = `QA Relocate Group ${testId}`;
    const userEmail = `qa-move-relocate-${testId}@example.com`;
    let moduleId;

    cy.apiCreateModuleFolder(sourceFolderName).then((sourceFolder) => {
      cy.apiCreateModuleFolder(destFolderName).then((destFolder) => {
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

      openModulesList();
      viewAppCardOptions(moduleName);
      cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
      cy.get(dashboardSelector.selectFolder).click();
      cy.get(commonSelectors.folderList).contains(destFolderName).click();
      cy.get(dashboardSelector.addToFolderButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(destFolderName), false);

      cy.get(dashboardSelector.folderName(destFolderName)).click();
      cy.get(commonSelectors.appCard(moduleName)).should('be.visible');

      cy.get(moduleSelectors.allModulesLink).click({ force: true });
      cy.get(dashboardSelector.folderName(sourceFolderName)).click();
      cy.get(commonSelectors.appCard(moduleName)).should('not.exist');
    });
  });

  it("a module's effective permission recalculates immediately once it's moved into a folder that grants access", () => {
    const folderName = `Recalc Folder ${testId}`;
    const moduleName = `Recalc Module ${testId}`;
    const groupName = `QA Recalc Group ${testId}`;
    const userEmail = `qa-move-recalc-${testId}@example.com`;
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
      cy.apiFullUserOnboarding('QA Recalc User', userEmail, 'builder', 'password', wsName, {}, [groupName]);

      // Before the move: the module isn't in the folder yet, so the folder's Edit
      // Modules grant doesn't apply — editing is blocked.
      cy.apiLogin(userEmail, 'password');
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      cy.get(moduleSelectors.versionSwitcherButton).click();
      cy.get(commonSelectors.buttonSelector('create draft version')).click();
      cy.get(versionModalSelector.versionNameInput).type('v2-before-move');
      cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        'You do not have permission to create a draft version'
      );

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
