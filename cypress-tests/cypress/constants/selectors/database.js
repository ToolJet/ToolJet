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
  deleteIcon: '[data-cy="delete-icon"]',
  nameInputField: (value) => {
    return `[data-cy="name-input-field-${value}"]`
  },

  currentTable: (tableName) => {
    return `[data-cy="${String(tableName).toLowerCase().replace(/\s+/g, "-")}-table"]`;
  },
  currentTableName: (tableName) => {
    return `[data-cy="${String(tableName).toLowerCase().replace(/\s+/g, "-")}-table-name"]`;
  },

  tableKebabIcon: '[data-cy="table-kebab-icon"]',
  tableEditOption: '[data-cy="edit-option"]',
  tableDeleteOption: '[data-cy="delete-option"]',

  editTableHeader: '[data-cy="edit-table-header"]'
};
