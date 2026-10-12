import { commonSelectors } from 'Selectors/common';
import { workflowSelector } from 'Selectors/platform/workflows';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openEditorExpectingRestricted,
  openWorkflowEditor,
  openWorkflowsList,
} from 'Support/utils/platform/folderPermissions';

describe('Workflows — Folder Permission Inheritance & Aggregation', () => {
  let workspaceId, wsName, wsSlug;

  // Workflows have no version-switcher UI, so access is asserted through the
  // editor: the start node renders once the workflow editor loads, and an
  // unauthorized user is routed to /error/restricted instead.
  const expectEditorAccess = (workflowId) => {
    openWorkflowEditor(wsSlug, workflowId);
    cy.url().should('not.include', '/error/restricted');
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `wf-folder-inherit-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['workflow', 'workflow_folder']);
  });

  it('a folder Edit Workflows grant gives editor access even when the direct workflow grant is View-only', () => {
    const attemptId = Date.now();
    const folderName = `Workflow Inherit Folder ${attemptId}`;
    const workflowName = `Inherit Workflow ${attemptId}`;
    const groupName = `QA Workflow Inherit Group ${attemptId}`;
    const userEmail = `qa-wf-inherit-union-${attemptId}@example.com`;
    let workflowId;

    cy.apiCreateWorkflowFolder(folderName).then((folder) => {
      cy.apiCreateWorkflow(workflowName).then(() => {
        workflowId = Cypress.env('workflowId');
        cy.apiAddWorkflowToFolder(workflowId, folder.id);
      });

      apiCreateGroup(groupName).then(() => {
        cy.apiCreateGranularPermission(
          groupName,
          `direct view ${attemptId}`,
          'workflow',
          { canEdit: false, canView: true },
          [],
          true
        ).then(() =>
          cy.apiCreateGranularPermission(
            groupName,
            `folder edit ${attemptId}`,
            'workflow_folder',
            { canEditFolder: false, canEditApps: true, canViewApps: false },
            [folder.id],
            false
          )
        );
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Inherit Union User', userEmail, 'builder', 'password', wsName, {}, [
        groupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      expectEditorAccess(workflowId);
    });
  });

  it('a user in multiple groups gets the highest applicable workflow folder permission', () => {
    const attemptId = Date.now();
    const folderName = `Workflow Multigroup Folder ${attemptId}`;
    const workflowName = `Multigroup Workflow ${attemptId}`;
    const viewGroupName = `QA Workflow Multigroup View ${attemptId}`;
    const editGroupName = `QA Workflow Multigroup Edit ${attemptId}`;
    const userEmail = `qa-wf-inherit-multigroup-${attemptId}@example.com`;
    let workflowId;

    cy.apiCreateWorkflowFolder(folderName).then((folder) => {
      cy.apiCreateWorkflow(workflowName).then(() => {
        workflowId = Cypress.env('workflowId');
        cy.apiAddWorkflowToFolder(workflowId, folder.id);
      });

      apiCreateGroup(viewGroupName).then(() =>
        cy.apiCreateGranularPermission(
          viewGroupName,
          `folder view ${attemptId}`,
          'workflow_folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );
      apiCreateGroup(editGroupName).then(() =>
        cy.apiCreateGranularPermission(
          editGroupName,
          `folder edit ${attemptId}`,
          'workflow_folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folder.id],
          false
        )
      );
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Multigroup User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);

      cy.apiLogin(userEmail, 'password');
      expectEditorAccess(workflowId);
    });
  });

  it("removing a user from the group granting Edit access reduces them to the remaining group's View-only access", () => {
    const attemptId = Date.now();
    const folderName = `Workflow Regress Folder ${attemptId}`;
    const workflowName = `Regress Workflow ${attemptId}`;
    const viewGroupName = `QA Workflow Regress View ${attemptId}`;
    const editGroupName = `QA Workflow Regress Edit ${attemptId}`;
    const userEmail = `qa-wf-inherit-regress-${attemptId}@example.com`;
    let workflowId;
    let editGroupId;

    cy.apiCreateWorkflowFolder(folderName).then((folder) => {
      cy.apiCreateWorkflow(workflowName).then(() => {
        workflowId = Cypress.env('workflowId');
        cy.apiAddWorkflowToFolder(workflowId, folder.id);
      });

      apiCreateGroup(viewGroupName).then(() =>
        cy.apiCreateGranularPermission(
          viewGroupName,
          `folder view ${attemptId}`,
          'workflow_folder',
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
          'workflow_folder',
          { canEditFolder: false, canEditApps: true, canViewApps: false },
          [folder.id],
          false
        );
      });
    });

    cy.then(() => {
      cy.apiFullUserOnboarding('QA Workflow Regress User', userEmail, 'builder', 'password', wsName, {}, [
        viewGroupName,
        editGroupName,
      ]);
      cy.apiLogin();
      cy.apiRemoveUserFromGroup(editGroupId, userEmail);

      cy.apiLogin(userEmail, 'password');

      // Left with View-only access after the Edit-granting group membership is
      // removed: the workflow is still listed in the folder, but the editor is
      // no longer reachable.
      openWorkflowsList();
      cy.get(commonSelectors.folderListcard(folderName)).click();
      cy.get(commonSelectors.appCard(workflowName)).should('be.visible');

      openEditorExpectingRestricted(wsSlug, workflowId);
    });
  });
});
