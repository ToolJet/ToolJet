export const cyParamName = (paramName = "") => {
  return String(paramName).toLowerCase().replace(/\s+/g, "-");
};

export const workflowSelector = {
  deleteWorkFlowOption: "[data-cy=delete-workflow-card-option]",
  globalWorkFlowsIcon: '[data-cy="icon-workflows"]',
  createWorkFlowsButton: '[data-cy="create-workflow"]',
  workflowsCreateButton: "[data-cy='create-new-workflows-button']",
  workflowRunButton: '[data-cy="workflow-run-button"]',
  workflowLogs: '[data-cy="Logs"] .text span',
  startNode: '[data-cy="start-node"]',
  startNodeHandleRight: '[data-cy="start-node-handle-right"]',
  optionsColumn: '[data-cy="options-column"]',
  importWorkFlowsOption: '[data-cy="import-dropdown-menu"]',
  importWorkFlowsLabel: '[data-cy="import-option-label"]',
  importWorkFlowsButton: '[data-cy="import-workflow"]',
  runjsInputField:
    '[data-cy="runjs-input-field"] .cm-content[contenteditable="true"]',
  pgsqlQueryInputField: '[data-cy="query-input-field"]',
  parametersInputField: '[data-cy="parameters-input-field"]',
  restapiUrlInputField: '[data-cy="url-input-field"]',
  workFlowNameInputField: '[data-cy="workflow-name-input"]',
  // Rename modal submit. The modal derives this from its action label, so it is
  // `rename-workflow` here and `rename-app` on the apps dashboard.
  renameWorkflowButton: '[data-cy="rename-workflow"]',
  responseNodeOutput: '[data-cy="response1-node-name"]',
  workflowWebhookIcon: '[data-cy="icon-webhook"]',
  workflowScheduleIcon: '[data-cy="icon-schedule"]',
  workflowWebhookToggle: '[data-cy="webhook-toggle"]',
  workflowTokenEyeIcon: '[data-cy="workflow-token-eye-icon"]',
  workflowEndpointUrl: '[data-cy="endpoint-url-field"]',
  workflowTokenField: '[data-cy="workflow-token-field"]',
  showDSPopoverButton: '[data-cy="show-ds-popover-button"]',
  workflowDataSourceOption: '[data-cy="ds-workflowsdefault"]',
  queryRenameInput: '[data-cy="query-rename-input"]',
  workflowDropdown: '[data-cy="workflow-dropdown"]',
  workflowSelectInput: 'input[id*="react-select"]',
  workflowSelectOption: '[class*="workflow-select"]',
  allWorkflowsLink: '[data-cy="all-workflows-link"]',

  nodeName: (nodeName) => `[data-cy="${cyParamName(nodeName)}-node"]`,

  inputField: (fieldName) =>
    `[data-cy="${cyParamName(fieldName)}"] .cm-content[contenteditable="true"]`,

  simpleInputField: (fieldName) => `[data-cy="${cyParamName(fieldName)}"]`,
  nodeHandleRight: (node) => `[data-cy="${node}-node-handle-right"]`,

  canvasEdge: ".react-flow__edge",
  nodeMenuTrigger: '[data-cy="node-menu-trigger"]',
  nodeMenuCopy: '[data-cy="node-menu-copy"]',
  nodeMenuDuplicate: '[data-cy="node-menu-duplicate"]',
  nodeMenuDelete: '[data-cy="node-menu-delete"]',
  // Rows of the selected run in the logs panel; failed rows carry .log-red.
  workflowLogErrorRow: '[data-cy="options-column"] .log-red',

  // The shared card-menu popover body. Needed to assert an option is ABSENT —
  // appCardOptions(text) builds a per-option selector, which cannot express
  // "no clone control exists".
  cardOptions: '[data-cy="card-options"]',
  workflowEnableToggle: '[data-cy="workflow-enable-toggle"] input',
  versionLockBanner: '[data-cy="version-lock-banner"]',
  versionLockInfoText: '[data-cy="version-lock-info-text"]',
  createDraftLink: '[data-cy="create-draft-link"]',
  confirmYesButton: '[data-cy="yes-button"]',
};

// Human-in-the-loop (HITL) step: editor settings panel, canvas node and sidebar entry.
export const humanSelector = {
  nodesSidebarIcon: '[data-cy="icon-nodes"]',
  sidebarHumanNode: '[data-cy="workflow-node-human-in-the-loop"]',
  nodeRow: ".react-flow__node",
  canvasPane: ".react-flow__pane",
  modal: '[data-cy="human-modal"]',
  nodeNameInput: '[data-cy="human-modal"] .node-name-input',
  description: '[data-cy="input-human-description"]',
  outcomeAdd: '[data-cy="human-outcome-add"]',
  outcomeRow: (index) => `[data-cy="human-outcome-row-${index}"]`,
  outcomeKey: (index) => `[data-cy="human-outcome-key-${index}"]`,
  outcomeLabel: (index) => `[data-cy="human-outcome-label-${index}"]`,
  outcomeColor: (index) => `[data-cy="human-outcome-color-${index}"]`,
  outcomeRemove: (index) => `[data-cy="human-outcome-remove-${index}"]`,
  inputFieldAdd: '[data-cy="human-input-field-add"]',
  inputField: (index) => `[data-cy="human-input-field-${index}"]`,
  inputFieldRemove: (index) => `[data-cy="human-input-field-remove-${index}"]`,
  inputFieldName: (index) =>
    `[data-cy="human-input-field-${index}"] input[placeholder="field_name"]`,
  inputFieldLabel: (index) =>
    `[data-cy="human-input-field-${index}"] input[placeholder="Display label"]`,
  inputFieldType: (index) =>
    `[data-cy="human-input-field-${index}"] .react-select__control`,
  inputFieldRequired: (index) =>
    `[data-cy="human-input-field-${index}"] .required-checkbox input`,
  inputFieldDefault: (index) =>
    `[data-cy="human-input-field-default-${index}"]`,
  inputFieldOptions: (index) =>
    `[data-cy="human-input-field-options-${index}"]`,
  inputFieldError: ".field-cell-error",
  timeoutToggle: '[data-cy="human-timeout-enabled-toggle-input"]',
  timeoutDuration: '[data-cy="human-timeout-duration"]',
  timeoutDurationValue: '[data-cy="human-timeout-duration"] input.duration-value',
  // The Select renders no data-cy of its own, so it is found through its label.
  timeoutOutcomeLabel: "Timeout outcome",
  timeoutOutcomeWarning: '[data-cy="human-timeout-outcome-warning"]',
  onExpireBranch: '[data-cy="human-modal"] input[name="onExpire"]',
  notificationUrl: '[data-cy="input-human-notification-url"]',
  notificationBody: '[data-cy="input-human-notification-body"]',
  headerAdd: '[data-cy="human-header-add"]',
  headerKey: (index) => `[data-cy="human-header-key-${index}"]`,
  headerValue: (index) => `[data-cy="human-header-value-${index}"]`,
  // The node on the canvas: handles are named after the outcome key.
  node: (nodeName) => `[data-cy="${cyParamName(nodeName)}-node"]`,
  outcomeHandle: (nodeName, outcomeKey) =>
    `[data-cy="${cyParamName(nodeName)}-node-handle-right-${outcomeKey}"]`,
  inputHandle: (nodeName) =>
    `[data-cy="${cyParamName(nodeName)}-node-handle-left"]`,
  waitingBanner: '[data-cy="hitl-waiting-banner"]',
  runLabel: '[data-cy="run-time-label"]',
  terminateRunButton: 'button[aria-label="Terminate Run"]',
  logRunItem: '[data-cy="Logs"]',
  nodeColumnItem: (nodeName) => `[data-cy="${cyParamName(nodeName)}-node-name"]`,
};

// Approvals tab: list, filters and the resolve dialog.
export const approvalSelector = {
  tab: '[data-cy="approvals-tab"]',
  executionsTab: '[data-cy="executions-tab"]',
  workflowsTab: '[data-cy="workflows-tab"]',
  tabs: '[data-cy="workflows-page-tabs"]',
  page: '[data-cy="approvals-page"]',
  table: '[data-cy="approvals-table"]',
  empty: '[data-cy="approvals-empty"]',
  loading: '[data-cy="approvals-loading"]',
  row: (id) => `[data-cy="approvals-row-${id}"]`,
  anyRow: '[data-cy^="approvals-row-"]',
  filterWorkflow: '[data-cy="approvals-filter-workflow"]',
  filterStatus: '[data-cy="approvals-filter-status"]',
  filterApprover: '[data-cy="approvals-filter-approver"]',
  filterFrom: '[data-cy="approvals-filter-from"]',
  filterTo: '[data-cy="approvals-filter-to"]',
  detail: '[data-cy="approval-detail-panel"]',
  detailApprovers: '[data-cy="approval-detail-approvers"]',
  detailReadonly: '[data-cy="approval-detail-readonly"]',
  detailOutcome: '[data-cy="approval-detail-outcome"]',
  inputForm: '[data-cy="approval-input-form"]',
  input: (name) => `[data-cy="approval-input-${name}"]`,
  outcomeButton: (key) => `[data-cy="approval-outcome-${key}"]`,
  anyOutcomeButton: '[data-cy^="approval-outcome-"]',
  cancel: '[data-cy="approval-cancel"]',
  pageIndicator: '[data-cy="approvals-page-indicator"]',
};

// Executions tab.
export const executionsSelector = {
  page: '[data-cy="executions-page"]',
  table: '[data-cy="executions-table"]',
  row: (id) => `[data-cy="executions-row-${id}"]`,
  stop: (id) => `[data-cy="executions-stop-${id}"]`,
  refresh: '[data-cy="executions-refresh"]',
};
