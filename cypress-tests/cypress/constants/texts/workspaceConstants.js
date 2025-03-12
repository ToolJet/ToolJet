export const workspaceConstantsText = {
    workspaceConstantsHelperText:
        "To resolve a global workspace constant use {{constants.access_token}}",
    secretsConstantInfo: "To resolve a secret workspace constant use {{secrets.access_token}}Read documentation",
    emptyStateHeader: "No Workspace constants yet",
    emptyStateText:
        "Use workspace constants seamlessly in both the app builder and data source connections across ToolJet.",
    addNewConstantButton: "+ Create new constant",
    addConstatntText: "Add new constant in production ",
    constantCreatedToast: (type) => { return `${type} constant created successfully!` },
    secretConstantCreatedToast: "Secret constant created successfully!",
    constantsExisitToast: (type) => { return `${type} constant already exists!` },
    workspaceConstantsHelperText: "To resolve a global workspace constant use",
    nameFieldHelperText: 'Name must be unique and max 50 characters',
    globalConstHelperText: 'The values can be used anywhere in the product',
    secretsConstHelperText: 'The values are hidden and can only be used in data sources and queries',
    addConstantButton: 'Add constant',
    noResultFoundHeader: 'No workspace constants found',
    secretsHiddenText: 'Values of secret constants are hidden',
};
