import { commonSelectors, cyParamName } from "Selectors/common";
import {
  dataSourceFolderPermissionSelectors as dsFolderPerm,
  dataSourceFolderSelectors as dsFolder,
} from "Selectors/platform/dataSourceFolders";
import { groupsSelector } from "Selectors/platform/manageGroups";

export const openDataSourcesList = () => {
  cy.intercept("GET", "/api/folder-data-sources*").as("dataSourceFolders");
  cy.visit(`/${Cypress.env("workspaceSlug")}`);
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
  cy.get(commonSelectors.modalMessage).should(
    "have.text",
    "Deleting this folder will only delete the folder and not the data sources in it. This action is irreversible. Are you sure you want to continue?"
  );
  cy.get(commonSelectors.modalMessage).should(
    "have.text",
    "Deleting this folder will only delete the folder and not the data sources in it. This action is irreversible. Are you sure you want to continue?"
  );
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

// Asserts the folder's ⋮ menu is absent — it only renders when the viewer can rename or delete.
export const uiVerifyFolderMenuAbsent = (folderId) =>
  cy.get(dsFolder.folderMenuButton(folderId)).should("not.exist");

export const dragDataSourceToFolder = (dataSourceName, folderName, { expectDragLabel } = {}) => {
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseDown({
    position: "center",
  });
  // Clear the 8px activation threshold, then step onto the target.
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseMove(0, 20);
  cy.get(dsFolder.folderRow(folderName)).realMouseMove(5, 5, {
    position: "center",
  });
  cy.get(dsFolder.folderRow(folderName)).realMouseMove(0, 2, {
    position: "center",
  });

  // Release only once dnd-kit reports the folder as the active droppable.
  cy.get(dsFolder.folderRow(folderName))
    .closest(".datasource-folder")
    .should("have.class", "is-drop-over");

  // Assert the overlay label only after is-drop-over confirms the drag is active.
  if (expectDragLabel) {
    cy.get(dsFolder.dragOverlay).should("be.visible").and("have.text", expectDragLabel);
  }

  // Wait for the membership call so a later read cannot race the write.
  cy.intercept("POST", "/api/folder-data-sources*").as("dropIntoFolder");
  cy.get(dsFolder.folderRow(folderName)).realMouseUp({ position: "center" });
  return cy.wait("@dropIntoFolder");
};

export const dragDataSourceToStrayList = (dataSourceName) => {
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseDown({ position: "center" });
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseMove(0, 20);
  cy.get(dsFolder.strayDropZone).realMouseMove(5, 5, { position: "center" });
  cy.get(dsFolder.strayDropZone).realMouseMove(0, 2, { position: "center" });

  // Same release gate as dragDataSourceToFolder: wait for is-drop-over on the stray drop zone.
  cy.get(dsFolder.strayDropZone).should("have.class", "is-drop-over");

  cy.intercept("PUT", "/api/folder-data-sources/*").as("dropOutOfFolder");
  cy.get(dsFolder.strayDropZone).realMouseUp({ position: "center" });
  return cy.wait("@dropOutOfFolder");
};

export const multiSelectDataSources = (dataSourceNames = []) => {
  dataSourceNames.forEach((name) => {
    cy.get(dsFolder.dataSourceRow(name)).click({ shiftKey: true });
    cy.get(dsFolder.dataSourceRow(name))
      .parents('.datasource-draggable')
      .should('have.class', 'is-selected');
  });
};

export const uiOpenMoveDataSourceModal = (dataSourceName) => {
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realHover();
  cy.get(dsFolder.dataSourceMenuButton(dataSourceName)).click({ force: true });
  cy.get(dsFolder.dataSourceMenuItem(dataSourceName, "Move folder")).click({
    force: true,
  });
};

export const uiEnsureFolderExpanded = (folderName, dataSourceName) => {
  cy.get(dsFolder.folderRow(folderName)).should("exist");
  return cy.get("body").then(($body) => {
    if ($body.find(dsFolder.dataSourceRow(dataSourceName)).length === 0) {
      cy.get(dsFolder.folderRow(folderName)).click();
    }
  });
};

export const uiExpandDataSourceFolder = (folderName) =>
  cy.get(dsFolder.folderRow(folderName)).click();

export const uiVerifyDragPreview = (dataSourceName, expectedLabel) => {
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseDown({ position: "center" });
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseMove(0, 20);
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseMove(30, -60);
  cy.get(dsFolder.dragOverlay).should("be.visible").and("have.text", expectedLabel);
  cy.realPress("Escape");
  cy.get(dsFolder.dataSourceRow(dataSourceName)).realMouseUp({ position: "center" });
  cy.get(dsFolder.dragOverlay).should("not.exist");
};

export const QUERY_RUN_BLOCKED_MESSAGE =
  "You do not have permission to run queries on this data source";

// A blocked run is not an HTTP error: the run reports status failed with the restriction message.
export const verifyQueryRunBlocked = (body) => {
  expect(body.status, "query run status").to.equal("failed");
  expect(body.data?.responseObject?.responseBody).to.equal(QUERY_RUN_BLOCKED_MESSAGE);
};

// Only the permission gate is under test — the dummy URL's own reachability is not, so "allowed".
export const verifyQueryRunAllowed = (body) => {
  const refusal = body.data?.responseObject?.responseBody;
  expect(refusal, "query run is not refused by the restriction").to.not.equal(
    QUERY_RUN_BLOCKED_MESSAGE
  );
};

const restApiQueryOptions = (runOnPageLoad = false) => ({
  method: "get",
  url: "",
  url_params: [],
  headers: [],
  cookies: [],
  body: [],
  json_body: null,
  body_toggle: false,
  runOnPageLoad,
});

export const apiCreateAppWithQuery = (appName, dataSourceId, queryName, runOnPageLoad = false) => {
  let appId, versionId;
  return cy
    .apiCreateApp(appName)
    .then(() => {
      appId = Cypress.env("appId");
      return cy.apiGetAppData(appId);
    })
    .then((app) => {
      versionId = app.editing_version.id;
      Cypress.env("editingVersionId", versionId);
      Cypress.env("environmentId", app.editorEnvironment.id);
      return cy.apiCreateQuery(dataSourceId, versionId, queryName, "restapi", restApiQueryOptions(runOnPageLoad));
    })
    .then(() => ({ appId, versionId }));
};

export const apiCreateReleasedAppWithQuery = (appName, slug, dataSourceId, queryName) =>
  apiCreateAppWithQuery(appName, dataSourceId, queryName, true).then(({ appId, versionId }) => {
    cy.apiSaveAppVersion(appId, versionId, "v1");
    cy.apiPromoteAppVersion(Cypress.env("environmentId"), appId);
    cy.then(() => cy.apiPromoteAppVersion(Cypress.env("stagingEnvId"), appId));
    cy.apiReleaseApp(appName);
    cy.apiAddAppSlug(appName, slug);
    return cy.wrap({ appId, versionId });
  });

export const uiRunQueryInBuilder = (queryName) => {
  cy.intercept("POST", "/api/data-queries/*/versions/*/run/*").as("builderQueryRun");
  cy.get(dsFolder.listQuery(queryName)).click();
  cy.get(dsFolder.queryRunButton).click();
  return cy.wait("@builderQueryRun").its("response.body");
};

let releasedAppVisits = 0;

export const visitReleasedAppAndCaptureQueryRun = (slug) => {
  const alias = `releasedQueryRun${(releasedAppVisits += 1)}`;
  cy.intercept("POST", "/api/data-queries/*/run").as(alias);
  cy.visit(`/applications/${slug}`);
  return cy.wait(`@${alias}`).its("response.body");
};

export const openGroupGranularAccess = (groupName) => {
  const groupTitle = (name) => `[data-cy="${cyParamName(name)}-title"]`;
  uiWatchGranularPermissions();
  cy.visit(`/${Cypress.env("workspaceSlug")}/workspace-settings/groups`);
  // The page auto-selects Admin once it loads; a click that lands before that is overridden, so wait for Admin's header, click, then wait for the clicked group's header.
  cy.get(groupTitle("Admin"), { timeout: 30000 }).should("be.visible");
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupTitle(groupName)).should("be.visible");
  uiOpenGranularAccessTab({ waitForUsers: !ROLE_GROUPS.includes(groupName) });
};

export const uiWatchGranularPermissions = () => {
  cy.intercept("GET", "**/v2/group-permissions/*/granular-permissions").as("granularPermissions");
  cy.intercept("GET", "**/users/addable-users*").as("addableUsers");
};

const ROLE_GROUPS = ["Admin", "Builder", "End-user"];

export const uiOpenGranularAccessTab = ({ waitForUsers = true } = {}) => {
  cy.get(groupsSelector.granularLink).click();
  cy.wait("@granularPermissions");
  if (waitForUsers) cy.wait("@addableUsers");
};

export const uiOpenAddDataSourceFolderGrant = () => {
  cy.get(groupsSelector.addPermissionButton).click();
  cy.get(dsFolderPerm.addDataSourceFolderButton).click();
};

export const uiOpenEditDataSourceFolderGrant = () => {
  cy.get(dsFolderPerm.granularAccessRow).trigger("mouseover").realHover();
  cy.get(dsFolderPerm.editGranularAccess).click({ force: true });
};

export const uiSelectGrantFolders = (folderNames = []) => {
  cy.get(dsFolderPerm.sharedModalCustomRadio).check();
  cy.get(dsFolderPerm.sharedModalResourcesContainer).find('[class*="-control"]').click();
  folderNames.forEach((name) => cy.contains(dsFolderPerm.sharedModalResourceOption, name).click());
  cy.get(dsFolderPerm.sharedModalPermissionNameInput).click();
};

export const uiAddUserToGroup = (email) => {
  cy.get(groupsSelector.usersLink).click();
  cy.clearAndType(groupsSelector.multiSelectSearchInput, email);
  cy.contains(".select-search__row", email).find('[type="checkbox"]').check({ force: true });
  cy.contains("button", "Add users").should("be.enabled").click();
};
