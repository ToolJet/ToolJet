export const cyParamName = (paramName = "") => {
    return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const workspaceConstantsSelectors = {
    workspaceConstantsHelperText: '[data-cy="workspace-constant-helper-text"]',
    emptyStateImage: '[data-cy="empty-state-image"]',
    emptyStateHeader: '[data-cy="empty-state-header"]',
    emptyStateText: '[data-cy="empty-state-text"]',
    addNewConstantButton: '[data-cy="add-new-constant-button"]',
    contantFormTitle: '[data-cy="constant-form-title"]',
    addConstantButton: '[data-cy="add-constant-button"]',
    envName: '[data-cy="env-name"]',
    constantsTableNameHeader: '[data-cy="workspace-variable-table-name-header"]',
    constantsTableValueHeader:
        '[data-cy="workspace-variable-table-value-header"]',

    constantName: (constName) => {
        return `[data-cy="${constName}-workspace-constant-name"]`;
    },
    constantValue: (constName) => {
        return `[data-cy="${constName}-workspace-constant-value"]`;
    },
    constEditButton: (constName) => {
        return `[data-cy="${constName}-edit-button"]`;
    },
    constDeleteButton: (constName) => {
        return `[data-cy="${constName}-delete-button"]`;
    },
};
