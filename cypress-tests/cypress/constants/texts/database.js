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

  tableCreatedSuccessfullyToast: (tableName) => {
    return `${tableName} created successfully`;
  },
  tableDeletedSuccessfullyToast: (tableName) => {
    return `Table "${tableName}" deleted successfully`
  },
  tableEditedSuccessfullyToast: (tableName) => {
    return `${tableName} edited successfully`;
  },
  tableExistsToast: (tableName) => {
    return `Table name already exists: ${tableName}`;
  },
};

