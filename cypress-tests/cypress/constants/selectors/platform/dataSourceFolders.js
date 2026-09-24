import { commonSelectors, cyParamName } from "Selectors/common";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";


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
  moveModalDataSourceSelect: '.react-select__control:has(+ * [id*="react-select"])',
  moveModalFolderSelectPlaceholder: 'Select folder',
  moveModalDataSourceSelectPlaceholder: 'Select data sources..',


  strayDropZone: '.datasource-stray-zone',

  // ---- data source row ----

  dataSourceRow: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-button"]`,
  dataSourceMenuButton: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-menu-btn"]`,
  // The menu option LABEL is slugged into the selector, so this tracks the

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

  cancelButton: commonSelectors.cancelButton,
  confirmDialogYesButton: commonSelectors.yesButton,
  sidebarContainer: dataSourceSelector.datasourceLabelOnList,
  searchIcon: dataSourceSelector.addedDsSearchIcon,
  searchBar: dataSourceSelector.AddedDsSearchBar,
};


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
  sharedModalEditFolderLabel: '[data-cy="edit-folder-permission-label"]',
  sharedModalEditFolderHelperText: '[data-cy="edit-folder-permission-helper-text"]',
  sharedModalConfigureLabel: '[data-cy="configure-permission-label"]',
  sharedModalConfigureHelperText: '[data-cy="configure-permission-helper-text"]',
  sharedModalBuildWithLabel: '[data-cy="build-with-permission-label"]',
  sharedModalBuildWithHelperText: '[data-cy="build-with-permission-helper-text"]',
  sharedModalRestrictQueryRunLabel: '[data-cy="restrict-query-run-label"]',
  sharedModalRestrictQueryRunHelperText: '[data-cy="restrict-query-run-helper-text"]',
  // Derived from the resource name by the shared modal, not a fixed string.
  allResourcesLabel: '[data-cy="all-data-source-folders-label"]',
  sharedModalEnvironmentContainer: '[data-cy="environment-selection-container"]',
  sharedModalEnvironmentLabel: '[data-cy="environment-label"]',
  // DEAD SELECTOR — kept for traceability, do not use. The product passes
  // data-cy="environment-select" as a prop to EnvironmentSelect (react-select),
  // which drops unknown props, so this attribute never renders. Assert the
  // container and the Coming Soon chip instead.
  sharedModalEnvironmentSelect: '[data-cy="environment-select"]',
  sharedModalComingSoonChip: '[data-cy="coming-soon-chip"]',
  sharedModalPermissionNameInput: '[data-cy="permission-name-input"]',
};
