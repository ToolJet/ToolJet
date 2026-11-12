export const workflowsText = {
  runjs: "runjs1",
  workflowNode: "workflows1",
  postgresqlNodeName: "postgresql1",
  restapiNodeName: "restapi1",
  harperdbNodeName: "harperdb1",
  runjsInputField: "runjs-input-field",
  pgsqlQueryInputField: "query-input-field",
  harperdbInputField: "sql_query-input-field",
  restapiUrlInputField: "url-input-field",
  workflowNameInputField: "workflow-name-input",
  exportWFOption: "export-workflow",
  jsonKeyPlaceholder: "key",
  jsonValuePlaceholder: "your value",
  workflowRunhelperText: "A few seconds ago",
  responseNodeKey: "data",
  responseNodeLabel: "Response",
  responseNodeName: "response1",
  runjsNodeLabel: "Run JavaScript code",
  workflowNodeLabel: "Run Workflow",
  runjsNodeCode: "return startTrigger.params",
  responseNodeQuery: "return runjs1.data",
  runjsNodeQueryForLargedataSet:
    "const bigArray = new Array(30000).fill(null).map((_, i) => 'test' + (i + 1)); const result = new Object(); result.data = bigArray; return result;",

  responseNodeExpectedValueTextForLargeDataset: "test1",
  workflowResponseNodeQuery: "return workflows1.data",
  responseNodeExpectedValueText: "your value",
  longStringJsonText:
    "ToolJet is an AI-native open-source low-code platform for building and deploying internal tools and business applications with minimal effort",
  // Self-contained, so the result doesn't depend on what the shared test
  // database happens to contain.
  postgresNodeQuery: "SELECT current_database() AS database_name;",
  postgresResponseNodeQuery: "return postgresql1.data",
  // The database createPostgresDataSource connects to.
  postgresExpectedValue: "postgres",

  restApiUrl: "http://9.234.17.31:8000/delay/10s",
  restApiResponseNodeQuery: "return restapi1.data",
  restApiExpectedValue: "<!DOCTYPE html>",

  harperDbNodeQuery: "SELECT * FROM tooljet_harper.tooljet_table;",
  harperDbNode: /sql/i,
  harperDbResponseNodeQuery: "return harperdb1.data",
  harperDbExpectedValue: "Test Record 3",
  harperDbPluginName: "HarperDB",

  runjsCodeForWebhooks: 'return "Verifying webhooks response"',
  runjsExpectedValueForWebhooks: "Verifying webhooks response",
  expectedStatusCodeText: 200,
  exportFixturePath: "cypress/fixtures/exportedApp.json",
  workflowLabel: "Workflow",

  // Workflow card menu copy. Workflow-specific — do NOT substitute the app
  // strings in Texts/common ("Delete app", "Clone app"): they do not render on a
  // workflow card.
  renameWorkflowOption: "Rename workflow",
  changeIconOption: "Change Icon",
  exportWorkflowOption: "Export workflow",
  deleteWorkflowOption: "Delete workflow",
  // No clone control renders on a workflow card. Both possible spellings are
  // asserted absent.
  cloneAppOption: "Clone app",
  cloneWorkflowOption: "Clone workflow",

  // lts-3.16 still says "Apps" in this sentence; this is the main/release wording.
  folderDeletePrefix: (folderName) =>
    `Are you sure you want to delete the folder ${folderName}?`,
  folderDeleteMessage: (folderName) =>
    `Are you sure you want to delete the folder ${folderName}? Workflows within the folder will not be deleted.`,

  nodeDeleteConfirmMessage: "Do you really want to delete this node?",
  duplicatedRunjsNodeName: "runjs1-copy",

  llmAgentFixturePath:
    "cypress/fixtures/templates/workflows/workflow_llm_agent_node-export-1781268843647.json",
  marketplacePluginsToBeInstalled: "Marketplace plugins to be installed",
  agentExecutionFailed: "Agent execution failed",

  // Server gate and engine messages asserted by the API-level specs.
  workflowDisabledError: "Workflow is disabled or does not exist",
  webhookDisabledError: "Webhook endpoint disabled or doesn't exists",
  invalidTokenError: "Invalid authentication token",
  workflowNotFoundError: "Workflow doesn't exists",
  noReleasedVersionError: "No released version found for this workflow",
  invalidEnvironmentError: "Invalid environment",
  loopNotArrayError: "Loop array did not resolve into an array",
  releaseNeedsProductionError:
    "You can only release when the version is promoted to production",
  invalidScheduleError: "is not a valid cron expression",
  responseStatusError: (code, reason) =>
    `Workflow failed due to HTTP status code: ${code} ${reason}`,
  versionLockedText: "This version is locked",
};

export const humanText = {
  sidebarNodeLabel: "Human-in-the-loop",
  defaultNodeName: "human1",
  defaultOutcomes: [
    { key: "approved", label: "Approve" },
    { key: "rejected", label: "Reject" },
  ],
  duplicateOutcomeKeyToast: "Outcome key must be unique",
  duplicateFieldName: "Field names must be unique",
  timeoutOutcomeWarning:
    "Pick an outcome, or the run fails when the timeout expires.",
  waitingBannerTitle: "Waiting for human input",
  waitingRunLabel: "Waiting for input",
  statusWaiting: "Waiting",
  statusSuccess: "Success",
  statusFailed: "Failed",
  statusStopped: "Stopped",
  notApprover: "You are not an approver for this request, so you cannot resolve it.",
  noApprovalsMatch: "No approval requests match these filters.",
  removeOutcomeConfirm: (label, edges) =>
    `Removing outcome "${label}" will also delete ${edges} connected edge(s). Continue?`,
  requiredInputToast: (label) => `"${label}" is required`,
  resolvedToast: (label) => `Resolved as "${label}"`,
  requestCancelledToast: "Request cancelled",
  notPendingError: "Approval request is not pending",
  notFoundError: "Approval request not found",
  unknownOutcomeError: (key) => `Unknown outcome "${key}"`,
  missingInputError: (name) => `Missing required input "${name}"`,
  notAuthorizedError: "Not authorized to resolve this approval request",
  setupError: "requires at least one outcome",
  approvalEmailSubject: (workflowName) => `Approval requested: ${workflowName}`,
  approvalEmailCta: "Open approval dashboard",
};

export const inputsText = {
  nameRequired: "Input name is required",
  namesUnique: "Input names must be unique",
  numberDefault: "Default value must be a number",
  booleanDefault: "Default value must be true or false",
  arrayDefault: "Default value must be a valid JSON array",
  objectDefault: "Default value must be a valid JSON object",
  runDialogTitle: "Run workflow",
  noInputsConfigured: "No workflow inputs configured",
  requiredError: (name) => `Parameter "${name}" is required`,
  datatypeError: (name) => `Parameter "${name}" has an incorrect datatype`,
  startFailed: "Start node execution failed",
};

export const controlFlowText = {
  waitRangeError: "Enter a duration between 1 second and 30 days.",
  waitServerRangeError: "Wait duration must be between 1 second and 30 days",
  waitingRunLabel: "Waiting",
  waitingBanner: "Waiting before continuing",
  filterNotArray: "Filter input must resolve to an array",
  filterEmptyCondition: "Filter condition cannot be empty",
  filterEmptyInput: "Filter input expression cannot be empty",
  filterNoInput: "Filter requires one upstream input connection",
  filterManyInputs: "Filter accepts exactly one upstream input connection",
  filterTwoConnectionsHint:
    "Filter accepts exactly one input connection. Remove the additional connections.",
  filterEmptyPreview: "Preview the filter to inspect matching items.",
  ifEmptyCondition: (label) => `If condition "${label}" cannot be empty`,
  removeElseIfConfirm: (label, edges) =>
    `Removing "${label}" will also delete ${edges} connected edge(s). Continue?`,
  addElseIf: "+ Add else if",
  addElse: "+ Add else",
};

export const schedulesText = {
  panelTitle: "Schedules",
  createTitle: "Create schedule",
  editTitle: "Edit schedule",
  emptyList:
    "This workflow is not scheduled. Add a schedule to run this workflow in your preferred interval",
  noMatch: "No schedules match these filters.",
  everyMinute: "Every minute",
  duplicateName: "A schedule with this name already exists.",
  nameTooLong: "Schedule name must be 100 characters or fewer.",
  fieldOrder: [
    "Schedule name",
    "Environment",
    "Version",
    "Input overrides",
    "Schedule type",
  ],
};

export const executionsText = {
  noMatch: "No executions match these filters.",
  noSchedules: "No active schedules in this workspace.",
  noSchedulesScoped: "No active schedules match this view.",
  notScheduled: "Not scheduled",
  unresolvable: "Unresolvable",
  columns: [
    "Name",
    "Status",
    "Trigger",
    "Schedule",
    "Started at",
    "Duration",
    "Version",
    "Environment",
    "Actions",
  ],
  statusWaiting: "Waiting",
  statusStopped: "Stopped",
  statusSuccess: "Success",
  statusFailed: "Failed",
  allWorkflows: "All workflows",
  usedByEmpty: "No app or workflow in this workspace calls this workflow yet.",
  usedByLoadFailed: "Couldn't load where this workflow is used",
};
