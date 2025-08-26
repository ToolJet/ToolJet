export const postgreSqlText = {
  labelDataSources: "Datasources",
  labelAddDataSource: "+ add data source",

  allDataSources: () => {
    return Cypress.env("marketplace_action")
      ? "All data sources (45)"
      : "All data sources (43)";
  },
  commonlyUsed: "Commonly used (5)",
  allDatabase: () => {
    return Cypress.env("marketplace_action")
      ? "Databases (20)"
      : "Databases (18)";
  },
  allApis: "APIs (21)",
  allCloudStorage: "Cloud Storages (4)",

  postgreSQL: "PostgreSQL",
  labelConnectionType: "Connection type",
  manualConnectionOption: "Manual connection",
  connectionStringOption: "Connection string",
  labelHost: "Host",
  labelPort: "Port",
  labelSSL: "SSL",
  labelDbName: "Database name",
  labelUserName: "Username",
  labelPassword: "Password",
  labelEncrypted: "Encrypted",
  labelConnectionOptions: "Connection options",
  sslCertificate: "SSL certificate",
  whiteListIpText:
    "Please white-list our IP address if the data source is not publicly accessible",
  textCopy: "Copy",
  readDocumentation: "Read documentation",
  couldNotConnect: "could not connect",
  buttonTextSave: "Save",
  serverNotSuppotSsl: "The server does not support SSL connections",
  psqlName: "cypress-postgresql",

  labelConnectionVerified: "connection verified",
  toastDSAdded: "Data Source Added",
  placeholderNameOfDB: "Name of the database",
  placeholderEnterHost: "Enter host",
  placeholderEnterPort: "Enter port",
  placeholderEnterUserName: "Enter username",

  headerQueries: "Queries",
  headerSelectDatasource: "Select Data Source",
  noQueryText: "You haven't created queries yet.",
  buttonLabelCreateQuery: "Create query",
  tabGeneral: "General",
  firstQueryName: "postgresql1",
  buttonLabelPreview: "Preview",
  buttonLabelCreateAndRun: "Create & Run",
  buttonLabelRun: "Run⌘↩",
  buttonLabelCreate: "Create",
  queryModeSql: "SQL mode",
  queryModeGui: "GUI mode",
  queryTabSetup: "Setup",
  queryTabTransformation: "Transformation",
  queryTabSettings: "Settings",
  headerTransformations: "Enable Transformations",
  headerTransformation: "Enable transformation",
  json: "JSON",
  raw: "Raw",

  labelOperation: "Operation",
  labelTable: "Table",
  labelPrimaryKeyColumn: "Primary key column",
  labelRecordsToUpdate: "Records to update",

  toggleLabelRunOnPageLoad: "Run this query on application load",
  toggleLabelconfirmation: "Request confirmation before running query",
  toggleLabelShowNotification: "Show notification on success",
  labelSuccessMessage: "Success Message",
  labelNotificatioDuration: "Notification duration (s)",

  dialogueTextDelete: "Do you really want to delete this query?",
  cancel: "Cancel",
  yes: "Yes",

  guiOptionBulkUpdate: "Bulk update using primary key",
  buttonTextTestConnection: "Test connection",
  editButtonText: "Edit",
  unableAcquireConnectionAlertText: "Unable to acquire a connection",

  tabAdvanced: "Advanced",
  labelNoEventhandler: "No event handlers",
  toastDSSaved: "Data Source Saved",
};