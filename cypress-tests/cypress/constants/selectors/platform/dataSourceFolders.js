import { commonSelectors, cyParamName } from "Selectors/common";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";

/**
 * Data source folders — sidebar of the global data sources page.
 *
 * NOT interchangeable with commonSelectors.folder* (folderListcard,
 * folderCardOptions, …). Those address the dashboard's APP folder cards. Data
 * source folders are sidebar rows with their own data-cy namespace.
 *
 * ── Two addressing styles, deliberately not mixed ──────────────────────────
 *   folderRow(name)          slug of the folder NAME
 *   folder<X>(folderId)      folder UUID
 * Prefer the id-keyed builders. Spec folder names are timestamped, so a
 * name-keyed selector bakes a timestamp in, and a folder renamed mid-test
 * silently stops matching.
 *
 * ── Composed at runtime (grep for the literal finds nothing) ───────────────
 *   create/renameFolderButton   `${isRename ? 'rename' : 'create'}-datasource-folder-button`
 *   searchBar                   SearchBox builds `${dataCy}-search-bar` from dataCy="added-ds"
 *   addDataSourceFolderButton   `add-${resource.toLowerCase()}-button`
 *   every row/folder builder    template literal in the component
 *
 * ── Naming collisions to respect when choosing FIXTURE NAMES ───────────────
 * Several data-cy namespaces are flat, so a badly chosen fixture name can forge
 * another element's selector. All three are avoidable by naming fixtures with a
 * timestamp suffix (`ds-mover-1789…`, `Folder A 1789…`) — never by prefix words
 * that appear in the patterns below:
 *   1. folderRow builds `datasource-folder-<slug>`, while the row controls build
 *      `datasource-folder-menu-btn-<id>` / `-rename-btn-` / `-delete-btn-` /
 *      `-empty-`. A folder literally named "menu btn <id>" collides.
 *   2. pickerFolderHeader builds `ds-folder-<slug>` and selectDataSourceOption
 *      builds `ds-<slug>`. A DATA SOURCE named "folder-x" produces the same
 *      selector as a FOLDER named "x".
 *   3. dataSourceRow builds `<slug>-button`, which is byte-identical to
 *      commonSelectors.buttonSelector(text). A data source named "Save" matches
 *      every Save button on the page.
 */

export const dataSourceFolderSelectors = {
  // ---- sidebar (data-source-folder specific) ----
  createFolderIcon: '[data-cy="create-datasource-folder-icon"]',
  emptyDataSourcePageText: '[data-cy="empty-ds-page-text"]',

  // ---- folder row: keyed by folder NAME ----
  folderRow: (folderName) =>
    `[data-cy="datasource-folder-${cyParamName(folderName)}"]`,

  // ---- folder row controls: keyed by folder ID (prefer these) ----
  folderMenuButton: (folderId) =>
    `[data-cy="datasource-folder-menu-btn-${folderId}"]`,
  folderRenameOption: (folderId) =>
    `[data-cy="datasource-folder-rename-btn-${folderId}"]`,
  folderDeleteOption: (folderId) =>
    `[data-cy="datasource-folder-delete-btn-${folderId}"]`,
  folderEmptyText: (folderId) =>
    `[data-cy="datasource-folder-empty-${folderId}"]`,

  // ---- create / rename modal ----
  folderNameInput: '[data-cy="datasource-folder-name-input"]',
  createFolderButton: '[data-cy="create-datasource-folder-button"]',
  renameFolderButton: '[data-cy="rename-datasource-folder-button"]',

  // ---- move ("Update folder") modal ----
  moveToFolderButton: '[data-cy="move-datasource-to-folder-button"]',

  // ---- data source row ----
  // `dataSourceRow` is the row itself; see collision note 3 above.
  dataSourceRow: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-button"]`,
  dataSourceMenuButton: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-menu-btn"]`,
  // The menu option LABEL is slugged into the selector, so this tracks the
  // visible copy: `Move folder` -> "<ds>-move-folder-menu-item".
  dataSourceMenuItem: (dataSourceName, optionLabel) =>
    `[data-cy="${cyParamName(dataSourceName)}-${cyParamName(optionLabel)}-menu-item"]`,
  // Only rendered for STRAY rows. A row inside a folder gets the ⋮ menu instead
  // (List never passes menuOptions, DataSourceFolder does), so the two are
  // mutually exclusive — asserting both on one row always fails.
  strayDataSourceDeleteButton: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-delete-button"]`,

  // ---- query panel grouping (app builder) ----
  pickerFolderHeader: (folderName) =>
    `[data-cy="ds-folder-${cyParamName(folderName)}"]`,
  pickerDataSourceCard: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-add-query-card"]`,
  selectDataSourceOption: (dataSourceName) =>
    `[data-cy="ds-${cyParamName(dataSourceName)}"]`,

  /**
   * Shared with the rest of the app — aliased, not redefined, so there is one
   * source of truth. Listed here only so folder specs need one import.
   *   cancel-button    58 definitions across the app; 3 co-exist on this page
   *                    alone (create/rename modal, move modal, ConfirmDialog).
   *                    Always scope it to the open modal.
   *   yes-button       ConfirmDialog's confirm control, whatever the label says.
   *                    This page mounts two ConfirmDialogs (folder delete and
   *                    data source delete) — only one is ever shown.
   */
  cancelButton: commonSelectors.cancelButton,
  confirmDialogYesButton: commonSelectors.yesButton,
  sidebarContainer: dataSourceSelector.datasourceLabelOnList,
  searchIcon: dataSourceSelector.addedDsSearchIcon,
  searchBar: dataSourceSelector.AddedDsSearchBar,
};

/**
 * Granular permission UI for data source folders (EE only).
 *
 * The `row*` keys below ARE data-source-folder specific. The `sharedModal*` ones
 * are NOT: the add/edit permission modal reuses one set of data-cy values across
 * every resource type, so the same selectors also match the app, module and
 * workflow folder modals, and `restrict-query-run-checkbox` additionally matches
 * the per-data-source permission modal. No wrapper data-cy exists to scope them
 * to, so they are unambiguous ONLY once the data source folder modal is the one
 * on screen — open it via addDataSourceFolderButton first, and never assert on
 * them to prove WHICH resource type the modal belongs to.
 */
export const dataSourceFolderPermissionSelectors = {
  // group Permissions tab — coarse flags (data-source-folder specific)
  resourceRow: '[data-cy="resource-data-source-folders"]',
  createCheckbox: '[data-cy="data-source-folder-create-checkbox"]',
  deleteCheckbox: '[data-cy="data-source-folder-delete-checkbox"]',
  // CE only — CE collapses create+delete into this single control
  crudCheckbox: '[data-cy="data-source-folder-crud-checkbox"]',

  // granular access row (data-source-folder specific)
  granularAccessRow: '[data-cy="data-source-folder-granular-access"]',
  editGranularAccess: '[data-cy="edit-data-source-folder-granular-access"]',
  rowEditFolderRadio: '[data-cy="data-source-folder-edit-folder-radio"]',
  rowConfigureRadio: '[data-cy="data-source-folder-configure-radio"]',
  rowBuildWithRadio: '[data-cy="data-source-folder-build-with-radio"]',
  rowRestrictQueryRunCheckbox:
    '[data-cy="data-source-folder-restrict-query-run-checkbox"]',

  // entry point into the modal (composed: `add-${resource}-button`)
  addDataSourceFolderButton: '[data-cy="add-data_source_folder-button"]',

  // add/edit modal — SHARED across folder types, see block comment
  sharedModalEditFolderRadio: '[data-cy="edit-folder-permission-radio"]',
  sharedModalConfigureRadio: '[data-cy="configure-permission-radio"]',
  sharedModalBuildWithRadio: '[data-cy="build-with-permission-radio"]',
  sharedModalRestrictQueryRunCheckbox:
    '[data-cy="restrict-query-run-checkbox"]',
  sharedModalEnvironmentSelect: '[data-cy="environment-select"]',
  sharedModalComingSoonChip: '[data-cy="coming-soon-chip"]',
  sharedModalPermissionNameInput: '[data-cy="permission-name-input"]',
};
