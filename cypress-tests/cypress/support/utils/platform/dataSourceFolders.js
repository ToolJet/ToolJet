import { commonSelectors } from "Selectors/common";
import { dataSourceFolderSelectors as dsFolder } from "Selectors/platform/dataSourceFolders";

/**
 * Opens the global data sources page, where data source folders live.
 * Mirrors openModulesList() in Support/utils/platform/modules.
 */
export const openDataSourcesList = () => {
  cy.intercept("GET", "/api/folder-data-sources*").as("dataSourceFolders");
  cy.visit(`/${Cypress.env("workspaceSlug")}`);
  // Navigate via the sidebar icon rather than a hardcoded route — this is how
  // every existing data source spec gets here, and it doubles as the permission
  // signal (the icon is hidden entirely from users without data source access).
  cy.get(commonSelectors.globalDataSourceIcon, { timeout: 50000 }).click();
  cy.wait("@dataSourceFolders");
  cy.get(dsFolder.sidebarContainer, { timeout: 50000 }).should("be.visible");
};

export const uiCreateDataSourceFolder = (folderName) => {
  cy.get(dsFolder.createFolderIcon).click();
  cy.clearAndType(dsFolder.folderNameInput, folderName);
  cy.get(dsFolder.createFolderButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Folder created successfully!"
  );
};

/**
 * Opens a folder row's ⋮ menu.
 *
 * `.datasource-folder-menu-trigger` is `display: none` and only revealed by a
 * hover on the folder row — exactly like the data source row's trigger. A plain
 * .click() fails actionability with "this element is not visible", so force it.
 * (The button is in the DOM the whole time; it is only hidden. When the viewer
 * lacks both rename and delete rights the menu is not rendered at all, which is
 * what uiVerifyFolderMenuAbsent asserts.)
 */
export const uiOpenFolderMenu = (folderId) =>
  cy.get(dsFolder.folderMenuButton(folderId)).click({ force: true });

export const uiRenameDataSourceFolder = (folderId, newName) => {
  uiOpenFolderMenu(folderId);
  cy.get(dsFolder.folderRenameOption(folderId)).click();
  cy.clearAndType(dsFolder.folderNameInput, newName);
  cy.get(dsFolder.renameFolderButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Folder renamed successfully!"
  );
};

export const uiDeleteDataSourceFolder = (folderId) => {
  uiOpenFolderMenu(folderId);
  cy.get(dsFolder.folderDeleteOption(folderId)).click();
  // ConfirmDialog's confirm control is data-cy="yes-button" regardless of its label.
  cy.get(dsFolder.confirmDialogYesButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Folder deleted successfully!"
  );
};

export const uiVerifyDataSourceFolderExists = (folderName, shouldExist = true) =>
  cy
    .get(dsFolder.folderRow(folderName))
    .should(shouldExist ? "exist" : "not.exist");

/**
 * Asserts the folder's ⋮ menu is not reachable — the menu button only renders
 * when the viewer can rename OR delete, so its absence is the permission signal.
 */
export const uiVerifyFolderMenuAbsent = (folderId) =>
  cy.get(dsFolder.folderMenuButton(folderId)).should("not.exist");

/**
 * Drags a data source onto a folder row.
 *
 * DO NOT reach for cy.realDragAndDrop / cy.realDrag here. Those come from
 * cypress-real-dnd, which drives real HTML5 drag via CDP; its README lists
 * "dnd-kit with the default PointerSensor / MouseSensor" under the libraries it
 * explicitly does NOT support. This sidebar uses exactly that (a CustomPointerSensor
 * with an 8px activation distance), so those commands fail silently — the drop
 * never fires and the assertion fails with no clue why.
 *
 * cy.trigger('dragstart') is equally useless for the same reason. What works is a
 * real pointer sequence via cypress-real-events (wired in support/e2e.js), with the
 * first move clearing the 8px threshold before dnd-kit will start tracking a drag.
 */
export const dragDataSourceToFolder = (dataSourceName, folderName) => {
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseDown({
    position: "center",
  });
  // clear the activation threshold before aiming at the target
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseMove(0, 20);
  cy.get(dsFolder.folderRow(folderName)).realMouseMove(5, 5, {
    position: "center",
  });
  cy.get(dsFolder.folderRow(folderName)).realMouseUp({ position: "center" });
};

/**
 * Shift-click builds a multi-selection; a plain click clears it. Pass the items
 * in the order they should be picked — the first is a plain click.
 */
export const multiSelectDataSources = (dataSourceNames = []) => {
  dataSourceNames.forEach((name, index) => {
    if (index === 0) {
      cy.get(dsFolder.dataSourceRow(name)).click();
    } else {
      cy.get(dsFolder.dataSourceRow(name)).click({ shiftKey: true });
    }
  });
};

/**
 * Opens the "Update folder" modal from a data source row's ⋮ menu.
 *
 * Two non-obvious constraints, both learned the hard way:
 *  1. ONLY data sources inside a folder have this menu. List/index.jsx never passes
 *     `menuOptions`, so `hasMenu` is false for stray rows and they render a plain
 *     delete button instead. Expand the folder first (uiEnsureFolderExpanded).
 *  2. The trigger is `.datasource-row-menu-trigger { display: none }`, revealed only
 *     by `.datasources-list:hover`. Without a real hover it is not clickable, so
 *     hover first and force the click.
 */
export const uiOpenMoveDataSourceModal = (dataSourceName) => {
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realHover();
  cy.get(dsFolder.dataSourceMenuButton(dataSourceName)).click({ force: true });
  cy.get(dsFolder.dataSourceMenuItem(dataSourceName, "Move folder")).click({
    force: true,
  });
};

/**
 * Expands a folder only if it is not already showing the given data source.
 * The folder row is a TOGGLE — blindly clicking an already-expanded folder
 * collapses it and every row inside disappears.
 */
export const uiEnsureFolderExpanded = (folderName, dataSourceName) => {
  cy.get(dsFolder.folderRow(folderName)).should("exist");
  return cy.get("body").then(($body) => {
    if ($body.find(dsFolder.dataSourceRow(dataSourceName)).length === 0) {
      cy.get(dsFolder.folderRow(folderName)).click();
    }
  });
};

/** Raw toggle. Prefer uiEnsureFolderExpanded when you need it open. */
export const uiExpandDataSourceFolder = (folderName) =>
  cy.get(dsFolder.folderRow(folderName)).click();
