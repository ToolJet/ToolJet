import { commonSelectors } from 'Selectors/common';
import { moduleSelectors } from 'Selectors/platform/modules';
import { versionModalSelector } from 'Selectors/eeCommon';
import { openModulesList } from 'Support/utils/platform/modules';
import { apiCreateGroup } from 'Support/utils/manageGroups';

// Effective module access is a UNION of direct per-module grants and folder-derived
// grants (confirmed via server/src/modules/ability/util.service.ts createUserAppsPermissions —
// both paths feed the same editableAppsId/viewableAppsId sets, so a higher grant from
// either source always wins; nothing is ever subtracted).
describe('Modules — Folder Permission Inheritance & Aggregation', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-inherit-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  const attemptCreateDraft = (versionName) => {
    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector('create draft version')).click();
    cy.get(versionModalSelector.versionNameInput).type(versionName);
    cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
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

  it('a folder Edit Modules grant gives edit access even when the direct module grant is View-only', () => {
    const folderName = `Inherit Folder ${testId}`;
    const moduleName = `Inherit Module ${testId}`;
    const groupName = `QA Inherit Group ${testId}`;
    const userEmail = `qa-inherit-union-${testId}@example.com`;
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
    const folderName = `Multigroup Folder ${testId}`;
    const moduleName = `Multigroup Module ${testId}`;
    const viewGroupName = `QA Multigroup View ${testId}`;
    const editGroupName = `QA Multigroup Edit ${testId}`;
    const userEmail = `qa-inherit-multigroup-${testId}@example.com`;
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
    const folderName = `Regress Folder ${testId}`;
    const moduleName = `Regress Module ${testId}`;
    const viewGroupName = `QA Regress View ${testId}`;
    const editGroupName = `QA Regress Edit ${testId}`;
    const userEmail = `qa-inherit-regress-${testId}@example.com`;
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
      cy.apiFullUserOnboarding('QA Regress User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);
      cy.apiRemoveUserFromGroup(editGroupId, userEmail);

      cy.apiLogin(userEmail, 'password');
      cy.visit(`/${wsSlug}/apps/${moduleId}`, { failOnStatusCode: false });
      cy.wait(3000);
      attemptCreateDraft('v2-view-only-after-removal');
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        'You do not have permission to create a draft version'
      );
    });
  });
});
