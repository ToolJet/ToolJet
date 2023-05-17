export const databaseText = {
  allTableSubheader: "All tables",
  doNotHaveTableText: "You don't have any tables yet.",
  tablePageHeader: "Tables",

  createNewTableHeader: "Create a new table",
  tableNameLabel: "Table name",
  addColumnHeader: "Add columns",
  nameLabel: "Name",
  typeLabel: "Type",
  defaultLabel: "Default",
  primaryKeyLabel: "Primary Key",
  addMoreColumnsButton: "   Add more columns",

  editTableHeader: "Edit table",
  idColumnHeader: "id",
  noRecordsText: "You don't have any records yet.",
  deleteRecordButton: "Delete records",
  idColumnName: "id",

  tableCreatedSuccessfullyToast: (tableName) => {
    return `${tableName} created successfully`;
  },
  tableDeletedSuccessfullyToast: (tableName) => {
    return `Table "${tableName}" deleted successfully`;
  },
  tableEditedSuccessfullyToast: (tableName) => {
    return `${tableName} edited successfully`;
  },
  tableExistsToast: (tableName) => {
    return `Table name already exists: ${tableName}`;
  },
  deleteRowToast: (tableName, rowNumber) => {
    return `Deleted ${rowNumber} rows from table "${tableName}"`;
  },
  invalidErrorText: (value) => {
    return `invalid input syntax for type integer: "${value}"`;
  },
};

export const createNewColumnText = {
  createNewColumnHeader: "Create a new column",
  columnNameLabel: "Column name",
  dataTypeLabel: "Data type",
  defaultValueLabel: "Default value",
  columnCreatedSuccessfullyToast: "Column created successfully",
};

export const createNewRowText = {
  createNewRowHeader: "Create a new row",
  serialDataTypeLabel: "SERIAL",
  rowCreatedSuccessfullyToast: "Row created successfully",
};

export const filterText = {
  filterText: "  Filter",
  operation: {
    equals: "equals",
    greaterThan: "greater than",
    greaterThanEqual: "greater than or equal",
    lessThan: "less than",
    lessThanEqual: "less than or equal",
    notEqual: "not equal",
    like: "like",
    ilike: "ilike",
    match: "match",
    imatch: "imatch",
    in: "in",
  },
};

export const sortText = {
  sortByText: "Sort by",
  order: {
    ascending: "Ascending",
    descending: "Descending",
  },
};
export const editRowText = {
  editRowHeader: "Edit a row",
  selectRowToEditText: "Select a row to edit",
  rowEditedSuccessfullyToast: "Row edited successfully",
};
