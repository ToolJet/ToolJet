import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { workflowSelector } from 'Selectors/platform/workflows';
import { viewAppCardOptions } from 'Support/utils/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openEditorExpectingRestricted,
  openWorkflowEditor,
  openWorkflowsList,
} from 'Support/utils/platform/folderPermissions';
import { commonText } from 'Texts/common';
import { dashboardText } from 'Texts/platform/dashboard';

describe('Workflows — Moving Workflows Between Folders', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `wf-folder-move-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', ['workflow', 'workflow_folder']);
  });

  it('user with Edit Folder access sees only authorized folders in the move picker, and can move a workflow they can edit into one', () => {
    const attemptId = Date.now();
    const editableFolderName = `Editable Workflow Folder ${attemptId}`;
    const inaccessibleFolderName = `Inaccessible Workflow Folder ${attemptId}`;
    const workflowName = `Move Source Workflow ${attemptId}`;
    const groupName = `QA Workflow Move Group ${attemptId}`;
    const userEmail = `qa-wf-move-basic-${attemptId}@example.com`;

    cy.apiCreateWorkflowFolder(inaccessibleFolderName);
    cy.apiCreateWorkflowFolder(editableFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder edit ${attemptId}`,
          'workflow_folder',
          { canEditFolder: true, canEditApps: false, canViewApps: false },
          [folder.id],
          false
        )
      );
    });
    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Move Basic User', userEmail, 'builder', 'password', wsName, {}, [
        groupName,
      ]);
      cy.apiLogin(userEmail, 'password');
      // Ownership grants edit access on the workflow itself.
      cy.apiCreateWorkflow(workflowName);

      openWorkflowsList();
      cy.wait(2000);
      viewAppCardOptions(workflowName);
      cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
      cy.get(dashboardSelector.selectFolder).click();

      // The picker only lists folders this user has Edit Folder access to.
      cy.get(commonSelectors.folderList).should('contain.text', editableFolderName);
      cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleFolderName);

      cy.get(commonSelectors.folderList).contains(editableFolderName).click();
      cy.get(dashboardSelector.addToFolderButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, dashboardText.bulkMoveSuccessToast(editableFolderName), false);

      cy.get(dashboardSelector.folderName(editableFolderName)).click();
      cy.get(commonSelectors.appCard(workflowName)).should('be.visible');
    });
  });

  it('a workflow can belong to only one folder — moving it to another folder removes it from the previous one', () => {
    const attemptId = Date.now();
    const sourceFolderName = `Workflow Source Folder ${attemptId}`;
    const destFolderName = `Workflow Dest Folder ${attemptId}`;
    const workflowName = `Relocating Workflow ${attemptId}`;
    const groupName = `QA Workflow Relocate Group ${attemptId}`;
    const userEmail = `qa-wf-move-relocate-${attemptId}@example.com`;
    let workflowId;
    let destFolderId;

    cy.apiCreateWorkflowFolder(sourceFolderName).then((sourceFolder) => {
      cy.apiCreateWorkflowFolder(destFolderName).then((destFolder) => {
        destFolderId = destFolder.id;
        apiCreateGroup(groupName).then(() =>
          cy.apiCreateGranularPermission(
            groupName,
            `folder edit ${attemptId}`,
            'workflow_folder',
            { canEditFolder: true, canEditApps: false, canViewApps: false },
            [sourceFolder.id, destFolder.id],
            false
          )
        );

        cy.apiCreateWorkflow(workflowName).then(() => {
          workflowId = Cypress.env('workflowId');
          cy.apiAddWorkflowToFolder(workflowId, sourceFolder.id);
        });
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Relocate User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      cy.apiLogin(userEmail, 'password');

      // Move it into the destination folder — via API, verified via UI.
      cy.then(() => cy.apiAddWorkflowToFolder(workflowId, destFolderId));

      openWorkflowsList();
      cy.get(dashboardSelector.folderName(destFolderName)).click();
      cy.get(commonSelectors.appCard(workflowName)).should('be.visible');

      cy.get(workflowSelector.allWorkflowsLink).click({ force: true });
      cy.get(dashboardSelector.folderName(sourceFolderName)).click();
      cy.get(commonSelectors.appCard(workflowName)).should('not.exist');
    });
  });

  it("a workflow's effective permission recalculates immediately once it's moved into a folder that grants access", () => {
    const attemptId = Date.now();
    const folderName = `Workflow Recalc Folder ${attemptId}`;
    const workflowName = `Recalc Workflow ${attemptId}`;
    const groupName = `QA Workflow Recalc Group ${attemptId}`;
    const userEmail = `qa-wf-move-recalc-${attemptId}@example.com`;
    let workflowId;
    let folderId;

    cy.apiCreateWorkflowFolder(folderName).then((folder) => {
      folderId = folder.id;
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `folder edit ${attemptId}`,
          'workflow_folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folderId],
          false
        )
      );
      cy.apiCreateWorkflow(workflowName).then(() => {
        workflowId = Cypress.env('workflowId');
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Recalc User', userEmail, 'builder', 'password', wsName, {}, [groupName]);
      openEditorExpectingRestricted(wsSlug, workflowId);

      // Move it into the folder (as admin) — no re-login for the test user needed.
      cy.apiLogin();
      cy.apiAddWorkflowToFolder(workflowId, folderId);

      // After the move: same user, fresh visit, the editor now loads via the folder grant.
      cy.apiLogin(userEmail, 'password');
      openWorkflowEditor(wsSlug, workflowId);
      cy.url().should('not.include', '/error/restricted');
    });
  });
});
