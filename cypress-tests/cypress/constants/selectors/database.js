import { cyParamName } from "./common";

export const databaseSelectors = {
  addTableButton: '[data-cy="add-table-button"]',
  tablePageHeader: '[data-cy="tables-page-header"]',
  doNotHaveTableText: '[data-cy="do-not-have-table-text"]',
  searchTableInputField: '[data-cy="search-table-input"]',
  allTablesSection: '[data-cy="all-table-column"]',
  allTableSubheader: '[data-cy="all-tables-subheader"]',
  createNewTableHeader: '[data-cy="create-new-table-header"]',

  tableNameLabel: '[data-cy="table-name-label"]',
  tableNameInputField: '[data-cy="table-name-input-field"]',
  addColumnsHeader: '[data-cy="add-columns-header"]',
  nameLabel: '[data-cy="name-input-field-label"]',
  typeLabel: '[data-cy="type-input-field-label"]',
  defaultLabel: '[data-cy="default-input-field-label"]',
  idInputField: '[data-cy="name-input-field-id"]',
  typeInputField: '[data-cy="type-dropdown-field"]',
  defaultInputField: '[data-cy="default-input-field"]',
  addMoreColumnsButton: '[data-cy="add-more-columns-button"]',
  deleteIcon: '[data-cy="column-delete-icon"]',

  tableKebabIcon: '[data-cy="table-kebab-icon"]',
  tableEditOption: '[data-cy="edit-option"]',
  tableDeleteOption: '[data-cy="delete-option"]',

  editTableHeader: '[data-cy="edit-table-header"]',

  idColumnHeader: '[data-cy="id-column-header"]',
  noRecordsText: '[data-cy="do-not-have-records-text"]',
  deleteRecordButton: '[data-cy="delete-row-records-button"]',

  nameInputField: (value) => {
    return `[data-cy="name-input-field-${value}"]`
  },
  currentTable: (tableName) => {
    return `[data-cy="${String(tableName).toLowerCase().replace(/\s+/g, "-")}-table"]`;
  },
  currentTableName: (tableName) => {
    return `[data-cy="${String(tableName).toLowerCase().replace(/\s+/g, "-")}-table-name"]`;
  },
  columnHeader: (columnName) => {
    return `[data-cy="${String(columnName).toLowerCase().replace(/\s+/g, "-")}-column-header"]`;
  },
  checkboxCell: (idColumn) => {
    return `[data-cy="${idColumn}-checkbox-table-cell"]> div > input`
  },
};

export const createNewColumnSelectors = {
  addNewColumnButton: '[data-cy="add-new-column-button"]',
  createNewColumnHeader: '[data-cy="create-new-column-header"]',
  columnNameLabel: '[data-cy="column-name-input-field-label"]',
  dataTypeLabel: '[data-cy="data-type-input-field-label"]',
  defaultValueLabel: '[data-cy="default-value-input-field-label"]',
  columnNameInputField: '[data-cy="column-name-input-field"]',
  dataTypeDropdown: '[data-cy="data-type-dropdown-section"]',
  defaultValueInputField: '[data-cy="default-value-input-field"]',
};

export const createNewRowSelectors = {
  addNewRowButton: '[data-cy="add-new-row-button-text"]',
  createNewRowHeader: '[data-cy="create-new-row-header"]',
  idColumnNameLabel: '[data-cy="id-column-name-label"]',
  serialDataTypeLabel: '[data-cy="integer-data-type-label"]',
  idColumnInputField: '[data-cy="id-input-field"]',


  columnNameLabel: (columnName) => {
    return `[data-cy="${String(columnName).toLowerCase().replace(/\s+/g, "-")}-column-name-label"]`;
  },
  columnNameInputField: (columnName) => {
    return `[data-cy="${String(columnName).toLowerCase().replace(/\s+/g, "-")}-input-field"]`;
  },
};

export const filterSelectors = {
  filterButton: '[data-cy="filter-button"]',
  selectColumnField: '[data-cy="select-column-field"]',
  selectOperationField: '[data-cy="select-operation-field"]',
  valueInputField: '[data-cy="value-input-field"]',
  deleteIcon: '[data-cy="delete-icon"]',
  addConditionLink: '[data-cy="add-condition-link"]',
};

export const sortSelectors = {
  sortButton: '[data-cy="sort-button"]',
  selectColumnField: '[data-cy="select-column-field"]',
  selectOrderField: '[data-cy="select-order-field"]',
  deleteIcon: '[data-cy="delete-icon"]',
  addConditionLink: '[data-cy="add-another-condition-link"]',
};

export const editRowSelectors = {
  editRowbutton: '[data-cy="edit-row-button-text"]',
  editRowHeader: '[data-cy="edit-row-header"]',
  idColumnNameLabel: '[data-cy="id-column-name-label"]',
  selectRowDropdown: '[data-cy="select-row-dropdown"]',
  getRowData: (rowNumber, columnName) => {
    return `[data-cy="id-${String(rowNumber).toLowerCase().replace(/\s+/g, "-")}-column-${String(columnName).toLowerCase().replace(/\s+/g, "-")}-table-cell"]`
  }
};