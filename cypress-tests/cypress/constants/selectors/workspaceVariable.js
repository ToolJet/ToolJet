export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};
export const workspaceVarSelectors = {
  novariableText: '[data-cy="no-variable-text"]',
  addNewVariableButton: '[data-cy="add-new-variables-button"]',
  workspaceVarFormTitle: '[data-cy="workspace-variable-form-title"]',
  workspaceVarNameLabel: '[data-cy="workspace-variable-name-label"]',
  workspaceVarNameInput: '[data-cy="workspace-variable-name-input"]',
  workspaceVarValueLabel: '[data-cy="workspace-variable-value-label"]',
  workspaceVarValueInput: '[data-cy="workspace-variable-value-input"]',
  workspaceVarTypeLabel: '[data-cy="workspace-variable-type-label"]',
  addVariableButton: '[data-cy="add-varable-button"]',
  workspaceVarTable: '[data-cy="workspace-variable-table"]',
  workspaceVarTableNameHeader:
    '[data-cy="workspace-variable-table-name-header"]',
  workspaceVarTableValueHeader:
    '[data-cy="workspace-variable-table-value-header"]',
  workspaceVarTableTypeHeader:
    '[data-cy="workspace-variable-table-type-header"]',
  workspaceVarEditButton: (varName) => {
    return `[data-cy="${cyParamName(varName)}-workspace-variable-edit-button"]`;
  },
  workspaceVarDeleteButton: (varName) => {
    return `[data-cy="${cyParamName(
      varName
    )}-workspace-variable-delete-button"]`;
  },
  workspaceVarName: (varName) => {
    return `[data-cy="${cyParamName(varName)}-workspace-variable-name"]`;
  },
};
