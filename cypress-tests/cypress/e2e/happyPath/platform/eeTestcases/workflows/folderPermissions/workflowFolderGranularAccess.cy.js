import { commonSelectors } from 'Selectors/common';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  RESOURCES,
  TIERS,
  apiAddItemToFolder,
  apiCreateFolder,
  apiCreateItem,
  apiGetItemIdsInFolder,
  apiGrantFolderTier,
  expectFolderMenuAbsent,
  expectFolderMenuOptions,
  loginAs,
  openAll,
  openFolder,
  openList,
  openWorkflowEditor,
  phase,
  uiAddItemToFolder,
  uiRemoveItemFromFolder,
  uiRenameFolder,
} from 'Support/utils/platform/folderPermissions';

describe('Workflows — Folder Granular Access', { retries: 0 }, () => {
  const R = RESOURCES.workflow;
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `wf-folder-granular-${Date.now()}`;
    wsSlug = wsName;
    // The workflow card menu only mounts when the whole card is in view, which the default viewport cuts off.
    cy.viewport(1800, 1400);

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', [R.itemGrantType, R.granularType]);
    cy.apiUpdateGroupPermission('builder', { [R.coarse.create]: false, [R.coarse.delete]: false });
  });

  it('should let an Edit folder grant rename the folder, move workflows in and out of it from the UI, and open the workflow inside it', () => {
    const attemptId = Date.now();
    const folderName = `EditFolder Workflow Folder ${attemptId}`;
    const renamed = `${folderName} Renamed`;
    const workflowName = `EditFolder Workflow ${attemptId}`;
    const looseName = `Loose Workflow ${attemptId}`;
    const groupName = `QA EditFolder Workflow Group ${attemptId}`;
    const userEmail = `qa-wf-folder-editfolder-${attemptId}@example.com`;
    let folderId, workflowId, looseId;

    apiCreateFolder(R, folderName).then((folder) => {
      folderId = folder.id;
      apiCreateItem(R, workflowName).then((id) => {
        workflowId = id;
        apiAddItemToFolder(R, id, folder.id);
      });
      apiCreateGroup(groupName);
      apiGrantFolderTier(R, groupName, `${groupName} perm`, TIERS.editFolder, [folder.id]);
    });
    cy.apiFullUserOnboarding('QA EditFolder', userEmail, 'builder', 'password', wsName, {}, [groupName]);

    loginAs(userEmail);
    // The user owns this workflow, which is what lets them move it.
    apiCreateItem(R, looseName).then((id) => {
      looseId = id;
    });

    phase('rename: offered and works; delete stays a coarse right');
    openList(R);
    expectFolderMenuOptions(folderName, { rename: true, remove: false });
    uiRenameFolder(folderName, renamed);

    phase('move a loose workflow IN through the card menu');
    openAll(R);
    uiAddItemToFolder(looseName, renamed);
    cy.then(() => apiGetItemIdsInFolder(folderId, R.folderType).then((ids) => expect(ids).to.include(looseId)));

    phase('move it back OUT from inside the folder');
    openFolder(renamed);
    uiRemoveItemFromFolder(looseName);
    cy.then(() => apiGetItemIdsInFolder(folderId, R.folderType).then((ids) => expect(ids).to.deep.equal([workflowId])));

    phase('the workflow already in the folder opens in the editor');
    cy.then(() => openWorkflowEditor(wsSlug, workflowId));
  });

  it('should list, but not let the user manage, the folder of a workflow reached only through a direct workflow grant', () => {
    const attemptId = Date.now();
    const folderName = `Direct Grant Workflow Folder ${attemptId}`;
    const workflowName = `Direct Grant Workflow ${attemptId}`;
    const groupName = `QA Workflow Direct ${attemptId}`;
    const userEmail = `qa-wf-direct-${attemptId}@example.com`;

    apiCreateFolder(R, folderName).then((folder) => {
      apiCreateItem(R, workflowName).then((workflowId) => {
        apiAddItemToFolder(R, workflowId, folder.id);
        apiCreateGroup(groupName);
        cy.apiCreateGranularPermission(groupName, `${groupName} wf`, R.itemGrantType, { canEdit: false, canView: true }, [workflowId], false);
      });
    });
    cy.apiFullUserOnboarding('QA Direct', userEmail, 'builder', 'password', wsName, {}, [groupName]);

    // A folder is listed when it holds a workflow the viewer can see, even without a folder grant.
    loginAs(userEmail);
    openList(R);
    expectFolderMenuAbsent(folderName);
    openFolder(folderName);
    cy.get(commonSelectors.appCard(workflowName)).should('be.visible');
  });
});
