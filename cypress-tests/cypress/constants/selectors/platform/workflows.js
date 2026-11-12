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
  nodeDeleteMessage: '[data-cy="modal-message"]',
  nodeDeleteCancel: '[data-cy="modal-cancel-button"]',
  nodeDeleteConfirm: '[data-cy="modal-confirm-button"]',
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
  // The Select has no data-cy of its own, so it is found through its label.
  timeoutOutcomeLabel: "Timeout outcome",
  timeoutOutcomeWarning: '[data-cy="human-timeout-outcome-warning"]',
  onExpireBranch: '[data-cy="human-modal"] input[name="onExpire"]',
  notificationUrl: '[data-cy="input-human-notification-url"]',
  notificationBody: '[data-cy="input-human-notification-body"]',
  headerAdd: '[data-cy="human-header-add"]',
  headerKey: (index) => `[data-cy="human-header-key-${index}"]`,
  headerValue: (index) => `[data-cy="human-header-value-${index}"]`,
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

export const executionsSelector = {
  page: '[data-cy="executions-page"]',
  table: '[data-cy="executions-table"]',
  row: (id) => `[data-cy="executions-row-${id}"]`,
  stop: (id) => `[data-cy="executions-stop-${id}"]`,
  refresh: '[data-cy="executions-refresh"]',
};

export const inputsSelector = {
  icon: '[data-cy="icon-inputs"]',
  add: ".workflow-input-add",
  addFirst: ".workflow-inputs-empty",
  card: ".workflow-input-card",
  error: ".workflow-input-error",
  name: 'input[placeholder="region"]',
  defaultValue: 'input[placeholder="Optional"]',
  required: ".workflow-input-required input",
  typeControl: ".react-select__control",
  remove: ".workflow-input-delete",
  runDialog: ".modal-base",
  runDialogTitle: '[data-cy="modal-title"]',
  runDialogConfirm: '[data-cy="confirm-button"]',
  overrideRow: ".workflow-input-value",
  overrideToggle: ".workflow-input-value-toggle input",
  overrideValue: '.workflow-input-value > input[type="text"], .workflow-input-value > input:not([type])',
  startNodeEmpty: ".next-run-params-empty",
};

export const controlFlowSelector = {
  waitDurationValue: '[data-cy="wait-duration-value"]',
  waitDurationUnit: ".duration-input .react-select__control",
  waitInvalid: ".duration-input--invalid",
  waitError: ".field-error",
  filterInput: '[data-cy="input-filter-array-expression"] .cm-content[contenteditable="true"]',
  filterPredicate: '[data-cy="input-filter-predicate-expression"] .cm-content[contenteditable="true"]',
  filterError: ".filter-node-modal-content .field-error",
  previewButton: '[data-cy="preview-button"]',
  nodePreviewButton: ".header-preview-btn",
  nodeResultBody: ".result-section .result-body",
  ifModal: '[data-cy="if-condition-modal"]',
  ifCondition: (index) =>
    `.if-branch:eq(${index}) .cm-content[contenteditable="true"]`,
  ifBranch: ".if-branch",
  ifBranchRemove: ".if-branch-remove",
  ifAddElseIf: ".if-branch-actions button",
  ifHandleLabel: ".if-handle-label",
  ifHandle: (nodeName, branchId) =>
    `[data-cy="${cyParamName(nodeName)}-node-handle-right-${branchId}"]`,
  anyIfHandle: (nodeName) =>
    `[data-cy^="${cyParamName(nodeName)}-node-handle-right-"]`,
  resultBody: '[data-cy="result-body"]',
  blockOptions: ".block-option-container",
  sidebarWait: '[data-cy="workflow-node-wait"]',
  sidebarFilter: '[data-cy="workflow-node-filter"]',
  sidebarIf: '[data-cy="workflow-node-if-condition"]',
  nodesIcon: '[data-cy="icon-nodes"]',
  nodeHandleLeft: (nodeName) =>
    `[data-cy="${cyParamName(nodeName)}-node-handle-left"]`,
  nodeHandleRight: (nodeName) =>
    `[data-cy="${cyParamName(nodeName)}-node-handle-right"]`,
  nodeColumnItem: (nodeName) => `[data-cy="${cyParamName(nodeName)}-node-name"]`,
};

export const schedulesSelector = {
  icon: '[data-cy="icon-schedule"]',
  drawer: ".schedule-inline-content",
  title: '[data-cy="trigger-title-row"] .title-text',
  newButton: '[data-cy="new-schedule-button"]',
  search: 'input[aria-label="Search schedules by name"]',
  environmentFilter: '[aria-label="Filter schedules by environment"]',
  versionFilter: '[aria-label="Filter schedules by version"]',
  filterWrapper: ".schedule-icon-filter",
  item: ".schedule-item",
  itemName: ".schedule-label p",
  itemMetadata: ".schedule-metadata",
  toggle: ".schedule-toggle input",
  noResults: ".schedule-no-results",
  emptyNote: ".schedule-popup-note",
  loadFailed: '[role="alert"]',
  pagination: ".schedule-pagination",
  pageNext: 'button[aria-label="Next page"]',
  pagePrev: 'button[aria-label="Previous page"]',
  editor: ".schedule-inline-editor",
  name: '[data-cy="workflow-schedule-name"]',
  fieldError: ".schedule-field-error",
  fieldLabels:
    ".schedule-name-label, .schedule-environment-label, .workflow-input-values-title, .schedule-type-label",
  environmentDropdown: ".schedule-environment:has(.schedule-environment-label)",
  versionDropdown: '[data-cy="schedule-version"]',
  typeTab: ".schedule-type-tab",
  createButton: ".schedule-create-button",
  saveButton: ".schedule-save-button",
  deleteButton: 'button[aria-label="Delete schedule"]',
  backButton: 'button[aria-label="Back to schedules"]',
  summary: ".schedule-body-content ~ *, .schedule-body",
};

export const usedBySelector = {
  icon: '[data-cy="icon-usedBy"]',
  drawer: '[data-cy="used-by-drawer"]',
  group: (type) => `[data-cy="used-by-${type}"]`,
  item: '[data-cy="used-by-item"]',
};

export const upcomingSelector = {
  panel: '[data-cy="upcoming-runs"]',
  toggle: '[data-cy="upcoming-runs-toggle"]',
  count: '[data-cy="upcoming-runs-count"]',
  empty: '[data-cy="upcoming-runs-empty"]',
  error: '[data-cy="upcoming-runs-error"]',
  row: '[data-cy="upcoming-run-row"]',
  times: '[data-cy="upcoming-run-times"]',
  time: ".upcoming-run-time",
  unregistered: '[data-cy="upcoming-run-unregistered"]',
  unresolvable: '[data-cy="upcoming-run-unresolvable"]',
};

export const executionsFilterSelector = {
  environment: '[data-cy="executions-environment-select"]',
  workflow: '[data-cy="executions-workflow-select"]',
  trigger: '[data-cy="executions-filter-trigger"]',
  count: '[data-cy="executions-filter-count"]',
  apply: '[data-cy="executions-filter-apply"]',
  reset: '[data-cy="executions-filter-reset"]',
  category: (key) => `[data-cy="executions-filter-category-${key}"]`,
  status: (value) => `[data-cy="executions-filter-status-${value}"]`,
  triggerType: (value) => `[data-cy="executions-filter-trigger-${value}"]`,
  from: '[data-cy="executions-filter-from"]',
  to: '[data-cy="executions-filter-to"]',
  empty: '[data-cy="executions-empty"]',
  recordCount: '[data-cy="executions-record-count"]',
  anyRow: '[data-cy^="executions-row-"]',
  refresh: '[data-cy="executions-refresh"]',
};
