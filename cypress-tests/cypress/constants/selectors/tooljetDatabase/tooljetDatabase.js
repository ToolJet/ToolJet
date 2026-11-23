// elements without a data-cy are addressed by class or text and noted inline

export const tooljetDatabaseSelectors = {
  // table list
  addTableButton: '[data-cy="add-table-button"]',
  tableItem: (name) => `[data-cy="${name}-table"]`,
  tableName: (name) => `[data-cy="${name}-table-name"]`,
  tableKebabIcon: '[data-cy="table-kebab-icon"]',
  renameTableOption: '[data-cy="rename-table-option"]',
  addColumnOption: '[data-cy="add-new-column-option"]',
  exportSchemaOption: '[data-cy="export-schema-option"]',
  exportCsvOption: '[data-cy="export-csv-option"]',
  deleteTableOption: '[data-cy="delete-table-option"]',
  deleteTableModal: '[data-cy="delete-table-modal"]',
  deleteTableConfirm: '[data-cy="delete-table-modal-confirm"]',

  // create / edit table drawer
  tableNameInput: '[data-cy="table-name-input-field"]',
  createButton: '[data-cy="create-button"]',
  saveChangesButton: '[data-cy="save-changes-button"]',

  // table grid
  columnHeader: (name) => `[data-cy="${name}-column-header"]`,
  totalRecords: '[data-cy="total-records"]',
  noRecordsText: '[data-cy="do-not-have-records-text"]',
  addNewDataButton: "button:contains('Add new data')", // no data-cy on the button
  addNewRowOption: '[data-cy="add-new-row-option"]',
  bulkUploadOption: '[data-cy="bulk-upload-data-option"]',
  seedDataOption: '[data-cy="seed-data-sql-option"]',
  // the row checkbox has no data-cy, so it is found through the row that holds the id cell
  rowOf: (rowId) => `[data-cy="id-${rowId}-column-id-table-cell"]`,
  editRowButton: '[data-cy="edit-row-button-text"]',
  deleteRowsButton: '[data-cy="delete-row-records-button"]',
  rowInput: (column) => `[data-cy="${column}-input-field"]`,
  cell: (rowId, column) => `[data-cy="id-${rowId}-column-${column}-table-cell"]`,

  // filter and sort
  filterButton: '[data-cy="filter-button"]',
  filterColumn: '[data-cy="select-column-field"]',
  filterOperation: '[data-cy="select-operation-field"]',
  filterValue: '[data-cy="value-input-field"]',
  sortButton: '[data-cy="sort-button"]',
  sortOrder: '[data-cy="select-order-field"]',

  // columns
  addColumnPlus: 'th.add-icon-column .icon-styles', // no data-cy on the header plus icon
  columnNameInput: '[data-cy="column-name-input-field"]',
  dataTypeDropdown: '[data-cy="data-type-dropdown-section"]',
  dropdownOption: '[class*="option"]',
  editColumnOption: '[data-cy="edit-column-option"]',
  omittedTypesFooter: '[data-cy="data-type-omitted-footer"]',

  // schema migration confirmation
  migrationModal: '[data-cy="migration-confirm-modal"]',
  migrationChanges: '[data-cy="migration-changes-list"]',
  migrationRun: '[data-cy="migration-confirm-run"]',

  // environments and migration history
  switcherButton: '[data-cy="tjdb-environment-switcher-button"]',
  historyButton: '[data-cy="tjdb-migration-history-button"]',
  environmentOption: (name) => `[data-cy="${name}-environment-option"]`,
  drawer: '.migration-history-drawer', // no data-cy on the drawer
  drawerStatus: '.migration-history-drawer__status',
  drawerRow: '.migration-history-drawer__row',
  drawerTab: '.migration-history-drawer__tab',
};
