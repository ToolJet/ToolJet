import { cyParamName } from "./common";


export const workspaceConstantsSelectors = {
    workspaceConstantsHelperText: '[data-cy="workspace-constant-helper-text"]',
    emptyStateImage: '[data-cy="empty-state-image"]',
    emptyStateHeader: '[data-cy="empty-state-header"]',
    emptyStateText: '[data-cy="empty-state-text"]',
    addNewConstantButton: '[data-cy="form-add-new-constant-button"]',
    contantFormTitle: '[data-cy="constant-form-title"]',
    addConstantButton: '[data-cy="add-constant-button"]',
    envName: '[data-cy="env-name"]',
    constantsTableNameHeader: '[data-cy="workspace-variable-table-name-header"]',
    constantsTableValueHeader:
        '[data-cy="workspace-variable-table-value-header"]',
    nameInputFiled: '[data-cy="name-input-field"]',

    constantName: (constName) => {
        return `[data-cy="${cyParamName(constName)}-workspace-constant-name"]`;
    },
    constantValue: (constName) => {
        return `[data-cy="${cyParamName(constName)}-workspace-constant-value"]`;
    },
    constEditButton: (constName) => {
        return `[data-cy="${cyParamName(constName)}-edit-button"]`;
    },
    constDeleteButton: (constName) => {
        return `[data-cy="${cyParamName(constName)}-delete-button"]`;
    },
    constHideButton: (constName) => {
        return `[data-cy="${cyParamName(constName)}-constant-visibility"]`;
    },
    constantsType: (type) => {
        return `[data-cy="${cyParamName(type)}-constants-input"]`;
    },
};
