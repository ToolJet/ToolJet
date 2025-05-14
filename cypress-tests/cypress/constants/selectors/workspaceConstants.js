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
    nameFieldLabel: '[data-cy="name-label"]',
    nameFieldHelperText: '[data-cy="name-info"]',
    typeLabel: '[data-cy="type-label"]',
    globalConstLabel: '[data-cy="global-constants-label"]',
    globalConstHelperText: '[data-cy="global-constants-info"]',
    secretsConstLabel: '[data-cy="secrets-constants-label"]',
    secretsConstHelperText: '[data-cy="secrets-constants-info"]',
    valueLabel: '[data-cy="value-label"]',
    alertInfoText: '[data-cy="alert-info-text"]',
    tableAddNewConstButton: '[data-cy="table-add-new-constant-button"]',
    searchField: '[data-cy="-search-bar"]',
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
