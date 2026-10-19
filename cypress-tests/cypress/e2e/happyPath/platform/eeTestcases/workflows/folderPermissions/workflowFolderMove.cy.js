import { commonSelectors } from 'Selectors/common';
import { dashboardSelector } from 'Selectors/platform/dashboard';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  RESOURCES,
  TIERS,
  apiAddItemToFolder,
  apiCreateFolder,
  apiCreateItem,
  apiGetItemIdsInFolder,
  apiGrantFolderTier,
  loginAs,
  openAll,
  openFolder,
  openList,
  pickItem,
  toggleItemsPicker,
  uiAddItemToFolder,
  uiOpenAddToFolder,
  uiPickFolder,
  uiSubmitAddToFolder,
} from 'Support/utils/platform/folderPermissions';

// Moving workflows between folders through the "Add to folder" modal, single and bulk.
describe('Workflows — Moving Workflows Between Folders', { retries: 0 }, () => {
  const R = RESOURCES.workflow;
  let workspaceId, wsName, wsSlug;

  // A group holding Edit folder on the given folders, and a builder in it.
  const setupEditor = (label, folderIds) => {
    const attemptId = Date.now();
    const groupName = `QA Workflow ${label} Group ${attemptId}`;
    const userEmail = `qa-wf-${label.toLowerCase()}-${attemptId}@example.com`;

    apiCreateGroup(groupName);
    apiGrantFolderTier(R, groupName, `folder edit ${attemptId}`, TIERS.editFolder, folderIds);
    cy.apiFullUserOnboarding(`QA Workflow ${label}`, userEmail, 'builder', 'password', wsName, {}, [groupName]);
    return cy.wrap(userEmail);
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `wf-folder-move-${Date.now()}`;
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
  });

  it('should offer only folders the user can edit in the move picker, and move a workflow the user can edit into one', () => {
    const attemptId = Date.now();
    const editableName = `Editable Workflow Folder ${attemptId}`;
    const inaccessibleName = `Inaccessible Workflow Folder ${attemptId}`;
    const workflowName = `Move Source Workflow ${attemptId}`;

    apiCreateFolder(R, inaccessibleName);
    apiCreateFolder(R, editableName).then((folder) => {
      setupEditor('Move', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        apiCreateItem(R, workflowName);

        openList(R);
        uiOpenAddToFolder(workflowName);
        cy.get(dashboardSelector.selectFolder).click();
        cy.get(commonSelectors.folderList).should('contain.text', editableName);
        cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleName);
        cy.get(commonSelectors.folderList).contains(editableName).click();
        uiSubmitAddToFolder(editableName);

        openFolder(editableName);
        cy.get(commonSelectors.appCard(workflowName)).should('be.visible');
      });
    });
  });

  it('should bulk move several workflows into an authorized folder in one submit', () => {
    const attemptId = Date.now();
    const folderName = `Bulk Workflow Folder ${attemptId}`;
    const names = [`Bulk Workflow A ${attemptId}`, `Bulk Workflow B ${attemptId}`, `Bulk Workflow C ${attemptId}`];

    apiCreateFolder(R, folderName).then((folder) => {
      setupEditor('Bulk', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        names.forEach((name) => apiCreateItem(R, name));

        openList(R);
        uiOpenAddToFolder(names[0]);
        toggleItemsPicker();
        pickItem(names[1]);
        pickItem(names[2]);
        toggleItemsPicker();
        cy.get(dashboardSelector.bulkMoveSelectedValue).should('contain.text', '3 apps selected');
        uiPickFolder(folderName);
        uiSubmitAddToFolder(folderName);

        apiGetItemIdsInFolder(folder.id, R.folderType).then((ids) => expect(ids).to.have.length(3));
        openFolder(folderName);
        names.forEach((name) => cy.get(commonSelectors.appCard(name)).should('be.visible'));
      });
    });
  });

  it('should bulk move every workflow the user can see with the "All" option', () => {
    const attemptId = Date.now();
    const folderName = `Bulk All Workflow Folder ${attemptId}`;
    const names = [`Bulk All Workflow A ${attemptId}`, `Bulk All Workflow B ${attemptId}`];

    apiCreateFolder(R, folderName).then((folder) => {
      setupEditor('BulkAll', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        names.forEach((name) => apiCreateItem(R, name));

        openList(R);
        uiOpenAddToFolder(names[0]);
        toggleItemsPicker();
        cy.contains(dashboardSelector.bulkMoveAppOption, 'All apps').click();
        toggleItemsPicker();
        uiPickFolder(folderName);
        uiSubmitAddToFolder(folderName);

        apiGetItemIdsInFolder(folder.id, R.folderType).then((ids) => expect(ids).to.have.length(names.length));
      });
    });
  });

  it('should keep a workflow in one folder only — a single or bulk move relocates it out of its previous folder', () => {
    const attemptId = Date.now();
    const sourceName = `Workflow Source Folder ${attemptId}`;
    const destName = `Workflow Dest Folder ${attemptId}`;
    const singleName = `Relocating Workflow ${attemptId}`;
    const bulkNames = [`Bulk Relocate Workflow A ${attemptId}`, `Bulk Relocate Workflow B ${attemptId}`];
    const bulkIds = [];
    let singleId;

    apiCreateFolder(R, sourceName).then((source) => {
      apiCreateFolder(R, destName).then((dest) => {
        apiCreateItem(R, singleName).then((id) => {
          singleId = id;
          apiAddItemToFolder(R, id, source.id);
        });
        bulkNames.forEach((name) =>
          apiCreateItem(R, name).then((id) => {
            bulkIds.push(id);
            apiAddItemToFolder(R, id, source.id);
          })
        );

        setupEditor('Relocate', [source.id, dest.id]).then((userEmail) => {
          loginAs(userEmail);
          openList(R);
          openFolder(sourceName);
          uiAddItemToFolder(singleName, destName);
          cy.then(() => cy.apiBulkAddAppsToFolder(dest.id, bulkIds));

          cy.then(() => {
            apiGetItemIdsInFolder(dest.id, R.folderType).then((ids) => expect(ids).to.have.members([singleId, ...bulkIds]));
            apiGetItemIdsInFolder(source.id, R.folderType).then((ids) => expect(ids).to.be.empty);
          });
          openList(R);
          openAll(R);
          openFolder(sourceName);
          cy.get(commonSelectors.empytyFolderImage).should('be.visible');
        });
      });
    });
  });
});
