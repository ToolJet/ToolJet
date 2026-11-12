import { commonSelectors, cyParamName } from "Selectors/common";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";

export const dataSourceFolderSelectors = {
  createFolderIcon: '[data-cy="create-datasource-folder-icon"]',
  emptyDataSourcePageText: '[data-cy="empty-ds-page-text"]',

  folderRow: (folderName) =>
    `[data-cy="datasource-folder-${cyParamName(folderName)}"]`,

  folderMenuButton: (folderId) =>
    `[data-cy="datasource-folder-menu-btn-${folderId}"]`,
  folderRenameOption: (folderId) =>
    `[data-cy="datasource-folder-rename-btn-${folderId}"]`,
  folderDeleteOption: (folderId) =>
    `[data-cy="datasource-folder-delete-btn-${folderId}"]`,
  folderEmptyText: (folderId) =>
    `[data-cy="datasource-folder-empty-${folderId}"]`,

  modalTitle: '[data-cy="modal-title"]',
  folderModalTitle: (title) => `[data-cy="${cyParamName(title)}-title"]`,
  roleConflictModal: '.role-change-modal-content',
  errorModal: '.edit-role-modal',
  errorModalMessage: '.edit-role-modal [data-cy="modal-message"]',
  errorModalHeader: '.edit-role-modal [data-cy="modal-header"]',
  errorModalClose: '.edit-role-modal [data-cy="close-button"]',
  roleConflictModalClose: '.role-change-modal-content [data-cy="modal-close-button"]',
  modalCloseButton: '[data-cy="modal-close-button"]',
  folderNamePlaceholder: 'Enter folder name..',
  // A foldered row lives in .datasource-folder-contents, a loose one in the stray zone.
  folderContents: '.datasource-folder-contents',

  folderNameInput: '[data-cy="datasource-folder-name-input"]',
  createFolderButton: '[data-cy="create-datasource-folder-button"]',
  renameFolderButton: '[data-cy="rename-datasource-folder-button"]',
  // The inline validation label under the name input has no data-cy.
  folderNameError: '.modal-content .tj-input-error',

  moveToFolderButton: '[data-cy="move-datasource-to-folder-button"]',
  moveModalDataSourceSelect: '.react-select__control:has(+ * [id*="react-select"])',
  moveModalFolderSelectPlaceholder: 'Select folder',
  moveModalDataSourceSelectPlaceholder: 'Select data sources..',
  // Both react-selects share classNamePrefix="move-ds-select" and carry no data-cy; scope a control by its field label (.move-ds-field) before using these.
  moveModalControl: '.move-ds-select__control',
  moveModalOption: '.move-ds-select__option',
  moveModalSelectedDataSource: '.move-ds-select__multi-value__label',
  moveModalRemoveDataSource: '.move-ds-select__multi-value__remove',
  moveModalSelectedFolder: '.move-ds-select__single-value',

  strayDropZone: '.datasource-stray-zone',
  // dnd-kit DragOverlay: shows the dragged row's name, or "N data sources".
  dragOverlay: '.datasource-drag-overlay',

  dataSourceRow: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-button"]`,
  dataSourceMenuButton: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-menu-btn"]`,
  // The menu option label is slugged into the selector, so it changes with the copy.
  dataSourceMenuItem: (dataSourceName, optionLabel) =>
    `[data-cy="${cyParamName(dataSourceName)}-${cyParamName(optionLabel)}-menu-item"]`,
  // Only rendered for STRAY rows.
  strayDataSourceDeleteButton: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-delete-button"]`,

  pickerFolderHeader: (folderName) =>
    `[data-cy="ds-folder-${cyParamName(folderName)}"]`,
  pickerDataSourceCard: (dataSourceName) =>
    `[data-cy="${cyParamName(dataSourceName)}-add-query-card"]`,
  selectDataSourceOption: (dataSourceName) =>
    `[data-cy="ds-${cyParamName(dataSourceName)}"]`,
  addQueryPopoverButton: dataSourceSelector.editorDSPopover,
  addQueryPopoverSearch: 'input[placeholder="Search for data source"]',
  emptyPickerSearch: '[data-cy="gds-querymanager-search-bar"]',
  listQuery: dataSourceSelector.listQuery,
  queryRunButton: dataSourceSelector.queryCreateAndRunButton,

  cancelButton: commonSelectors.cancelButton,
  confirmDialogYesButton: commonSelectors.yesButton,
  sidebarContainer: dataSourceSelector.datasourceLabelOnList,
  searchIcon: dataSourceSelector.addedDsSearchIcon,
  searchBar: dataSourceSelector.AddedDsSearchBar,
};

export const dataSourceFolderPermissionSelectors = {
  resourceRow: '[data-cy="resource-data-source-folders"]',
  createCheckbox: '[data-cy="data-source-folder-create-checkbox"]',
  deleteCheckbox: '[data-cy="data-source-folder-delete-checkbox"]',
  // CE only — CE collapses create+delete into this single control
  crudCheckbox: '[data-cy="data-source-folder-crud-checkbox"]',

  granularAccessRow: '[data-cy="data-source-folder-granular-access"]',
  editGranularAccess: '[data-cy="edit-data-source-folder-granular-access"]',
  rowEditFolderRadio: '[data-cy="data-source-folder-edit-folder-radio"]',
  rowConfigureRadio: '[data-cy="data-source-folder-configure-radio"]',
  rowBuildWithRadio: '[data-cy="data-source-folder-build-with-radio"]',
  rowRestrictQueryRunCheckbox:
    '[data-cy="data-source-folder-restrict-query-run-checkbox"]',

  addDataSourceFolderButton: '[data-cy="add-data_source_folder-button"]',

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
  sharedModalComingSoonChip: '[data-cy="coming-soon-chip"]',
  sharedModalPermissionNameInput: '[data-cy="permission-name-input"]',
  sharedModalPermissionNameError: '[data-cy="permission-name-error"]',
  // These info-text data-cy values are generated from the copy, so they change with it.
  sharedModalAllResourcesInfoText:
    '[data-cy="this-will-select-all-data-source-folders-in-the-workspace-including-any-new-data-source-folders-created-info-text"]',
  sharedModalCustomInfoText: '[data-cy="custom-info-text"]',
  sharedModalConfirmButton: '[data-cy="confirm-button"]',
  sharedModalAllResourcesRadio: '[data-cy="all-apps-radio"]',
  sharedModalCustomRadio: '[data-cy="custom-radio"]',
  sharedModalResourcesContainer: '[data-cy="resources-container"]',
  // AppsSelect options render a checkbox + .select-option label; chips render .selected-value.
  sharedModalResourceOption: '.select-option',
  sharedModalSelectedResource: '.selected-value',
};
