

export const dashboardUiSelector = {
  createNewAppButton: '[data-cy="create-an-app-button"]',

  //Modules
  modulesTabLabel: '[data-cy="modules-tab-label"]',
  createNewModuleButton: '[data-cy="create-new-module-button"]',
  moduleNameInput: '[data-cy="module-name-input"]',
  createModuleButton: '[data-cy="create-a-module-button"]',

  // Module empty-state
  moduleEmptyState: '[data-cy="module-empty-state"]',
  moduleEmptyStateImage: '[data-cy="module-empty-state-image"]',
  moduleEmptyStateHeader: '[data-cy="module-empty-state-header"]',
  moduleEmptyStateDescription: '[data-cy="module-empty-state-description"]',

  // Module card context-menu options
  renameModuleCardOption: '[data-cy="rename-module-card-option"]',
  cloneModuleCardOption: '[data-cy="clone-module-card-option"]',
  exportModuleCardOption: '[data-cy="export-module-card-option"]',
  deleteModuleCardOption: '[data-cy="delete-module-card-option"]',

  // Module action / confirm buttons
  cloneModuleButton: '[data-cy="clone-module-button"]',
  deleteModuleButton: '[data-cy="delete-module-button"]',

  // ── Workflows 
  createNewWorkflowButton: '[data-cy="create-new-workflow-button"]',
  workflowNameInput: '[data-cy="workflow-name-input"]',
  createWorkflowButton: '[data-cy="create-a-workflow-button"]',

  // Workflow empty-state
  workflowEmptyState: '[data-cy="workflow-empty-state"]',
  workflowEmptyStateImage: '[data-cy="workflow-empty-state-image"]',
  workflowEmptyStateHeader: '[data-cy="workflow-empty-state-header"]',
  workflowEmptyStateDescription: '[data-cy="workflow-empty-state-description"]',

  // Workflow card context-menu options
  renameWorkflowCardOption: '[data-cy="rename-workflow-card-option"]',
  cloneWorkflowCardOption: '[data-cy="clone-workflow-card-option"]',  // should not exist for workflows
  exportWorkflowCardOption: '[data-cy="export-workflow-card-option"]',
  deleteWorkflowCardOption: '[data-cy="delete-workflow-card-option"]',

  // Workflow action / confirm buttons
  deleteWorkflowButton: '[data-cy="delete-workflow-button"]',

  deleteFrontEndButton: '[data-cy="delete-front-end-button"]',
  renameAppCardOption: '[data-cy="rename-app-card-option"]',
  cloneAppCardOption: '[data-cy="clone-app-card-option"]',
  deleteAppCardOption: '[data-cy="delete-app-card-option"]',
  exportAppCardOption: '[data-cy="export-app-card-option"]',
};
