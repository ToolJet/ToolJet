import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { workflowSelector } from 'Selectors/platform/workflows';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import { openWorkflowEditor, openWorkflowsList } from 'Support/utils/platform/folderPermissions';

describe('Workflows — Folder Granular Access', () => {
  let workspaceId, wsName, wsSlug;

  // Workflows have no version-switcher UI, so "can this user work on it?" is
  // asserted through editor access: the start node renders when the workflow
  // editor loads, and the app router sends an unauthorized user to
  // /error/restricted instead.

  const setupFolderAccess = (label, permissions) => {
    const attemptId = Date.now();
    const folderName = `${label} Workflow Folder ${attemptId}`;
    const workflowName = `${label} Workflow ${attemptId}`;
    const groupName = `QA ${label} Workflow Group ${attemptId}`;
    const userEmail = `qa-wf-folder-${label.toLowerCase().replace(/\s+/g, '-')}-${attemptId}@example.com`;
    let folderId;
    let workflowId;

    return cy
      .apiCreateWorkflowFolder(folderName)
      .then((folder) => {
        folderId = folder.id;
        return cy.apiCreateWorkflow(workflowName);
      })
      .then(() => {
        workflowId = Cypress.env('workflowId');
        return cy.apiAddWorkflowToFolder(workflowId, folderId);
      })
      .then(() => apiCreateGroup(groupName))
      .then(() =>
        cy.apiCreateGranularPermission(groupName, `perm ${attemptId}`, 'workflow_folder', permissions, [folderId], false)
      )
      .then(() => cy.apiFullUserOnboarding(label, userEmail, 'builder', 'password', wsName, {}, [groupName]))
      .then(() => ({ folderId, workflowId, folderName, workflowName, userEmail }));
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `wf-folder-granular-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['workflow', 'workflow_folder']);
  });

  it('user with Edit Folder permission can rename an authorized folder, move workflows in and out of it, and open a workflow within it — and deleting the folder does not delete the workflow inside it', () => {
    setupFolderAccess('EditFolder', { canEditFolder: true, canEditApps: false, canViewApps: false }).then(
      ({ folderId, workflowId, folderName, workflowName, userEmail }) => {
        const renamedFolderName = `${folderName} Renamed`;
        const looseWorkflowName = `Loose Workflow ${Date.now()}`;
        let looseWorkflowId;

        cy.apiCreateWorkflow(looseWorkflowName).then(() => {
          looseWorkflowId = Cypress.env('workflowId');
        });

        cy.apiLogin(userEmail, 'password');

        // Rename the authorized folder — via API, verified via UI.
        cy.then(() => cy.apiRenameFolder(folderId, renamedFolderName));
        openWorkflowsList();
        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('exist');
        cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');

        // Add a loose workflow to the (renamed) folder, then remove it again — via API, verified via UI.
        cy.then(() => cy.apiAddWorkflowToFolder(looseWorkflowId, folderId));
        cy.get(dashboardSelector.folderName(renamedFolderName)).click();
        cy.get(commonSelectors.appCard(looseWorkflowName)).should('be.visible');

        cy.then(() => cy.apiRemoveWorkflowFromFolder(looseWorkflowId, folderId));
        cy.get(workflowSelector.allWorkflowsLink).click({ force: true });
        cy.get(dashboardSelector.folderName(renamedFolderName)).click();
        cy.get(commonSelectors.appCard(looseWorkflowName)).should('not.exist');

        // The workflow that lives inside the folder opens in the editor.
        openWorkflowEditor(Cypress.env('workspaceSlug'), workflowId);
        cy.url().should('not.include', '/error/restricted');

        // Deleting the folder (as its owner, admin) does not delete the workflow inside it.
        cy.apiLogin();
        cy.then(() => cy.apiDeleteFolder(folderId));
        openWorkflowsList();

        cy.get(commonSelectors.folderListcard(renamedFolderName)).should('not.exist');

        cy.get(workflowSelector.allWorkflowsLink).click({ force: true });
        cy.get(commonSelectors.appCard(workflowName)).should('exist');
      }
    );
  });

  it("non-owner without any folder-level grant cannot rename or manage another user's workflow folder", () => {
    const attemptId = Date.now();
    const folderName = `Unshared Workflow Folder ${attemptId}`;
    const userEmail = `qa-wf-folder-unshared-${attemptId}@example.com`;

    cy.apiCreateWorkflowFolder(folderName);
    cy.apiFullUserOnboarding('QA Unshared Workflow Folder User', userEmail, 'builder', 'password', wsName);

    cy.apiLogin(userEmail, 'password');
    openWorkflowsList();
    cy.get(commonSelectors.folderCardOptions(folderName)).should('not.exist');
  });
});
