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

describe('Modules — Moving Modules Between Folders', { retries: 0 }, () => {
  const R = RESOURCES.module;
  let workspaceId, wsName, wsSlug;

  const setupEditor = (label, folderIds) => {
    const attemptId = Date.now();
    const groupName = `QA Module ${label} Group ${attemptId}`;
    const userEmail = `qa-module-${label.toLowerCase()}-${attemptId}@example.com`;

    apiCreateGroup(groupName);
    apiGrantFolderTier(R, groupName, `folder edit ${attemptId}`, TIERS.editFolder, folderIds);
    cy.apiFullUserOnboarding(`QA Module ${label}`, userEmail, 'builder', 'password', wsName, {}, [groupName]);
    return cy.wrap(userEmail);
  };

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `module-folder-move-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
    cy.apiDeleteGranularPermission('builder', [R.itemGrantType, R.granularType]);
  });

  it('should offer only folders the user can edit in the move picker, and move a module the user can edit into one', () => {
    const attemptId = Date.now();
    const editableName = `Editable Module Folder ${attemptId}`;
    const inaccessibleName = `Inaccessible Module Folder ${attemptId}`;
    const moduleName = `Move Source Module ${attemptId}`;

    apiCreateFolder(R, inaccessibleName);
    apiCreateFolder(R, editableName).then((folder) => {
      setupEditor('Move', [folder.id]).then((userEmail) => {
        loginAs(userEmail);
        apiCreateItem(R, moduleName);

        openList(R);
        uiOpenAddToFolder(moduleName);
        cy.get(dashboardSelector.selectFolder).click();
        cy.get(commonSelectors.folderList).should('contain.text', editableName);
        cy.get(commonSelectors.folderList).should('not.contain.text', inaccessibleName);
        cy.get(commonSelectors.folderList).contains(editableName).click();
        uiSubmitAddToFolder(editableName);

        openFolder(editableName);
        cy.get(commonSelectors.appCard(moduleName)).should('be.visible');
      });
    });
  });

  it('should bulk move several modules into an authorized folder in one submit', () => {
    const attemptId = Date.now();
    const folderName = `Bulk Module Folder ${attemptId}`;
    const names = [`Bulk Module A ${attemptId}`, `Bulk Module B ${attemptId}`, `Bulk Module C ${attemptId}`];

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

  it('should keep a module in one folder only — a single or bulk move relocates it out of its previous folder', () => {
    const attemptId = Date.now();
    const sourceName = `Module Source Folder ${attemptId}`;
    const destName = `Module Dest Folder ${attemptId}`;
    const singleName = `Relocating Module ${attemptId}`;
    const bulkNames = [`Bulk Relocate Module A ${attemptId}`, `Bulk Relocate Module B ${attemptId}`];
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
