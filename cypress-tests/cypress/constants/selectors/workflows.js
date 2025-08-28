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
  runjsInputField:
    '[data-cy="runjs-input-field"] .cm-content[contenteditable="true"]',
  pgsqlQueryInputField: '[data-cy="query-input-field"]',
  parametersInputField: '[data-cy="parameters-input-field"]',
  restapiUrlInputField: '[data-cy="url-input-field"]',
  workFlowNameInputField: '[data-cy="workflow-name-input"]',
  responseNodeOutput: '[data-cy="response1-node-name"]',

  nodeName: (nodeName) => `[data-cy="${cyParamName(nodeName)}-node"]`,

  inputField: (fieldName) =>
    `[data-cy="${cyParamName(fieldName)}"] .cm-content[contenteditable="true"]`,

  simpleInputField: (fieldName) => `[data-cy="${cyParamName(fieldName)}"]`,
  nodeHandleRight: (node) => `[data-cy="${node}-node-handle-right"]`,
};