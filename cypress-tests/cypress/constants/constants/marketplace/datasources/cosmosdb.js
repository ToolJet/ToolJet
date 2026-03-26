export const cosmosdbUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "End point",
            validations: {
                isRequired: false,
                placeholder: "https://your-account.documents.azure.com",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Key",
            validations: {
                isRequired: false,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: false
            }
        }
    ]
};

export const cosmosdbFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "End point",
            text: `${Cypress.env('cosmosdb_end_point')}`
        },
        {
            type: "encrypted",
            fieldName: "Key",
            text: `${Cypress.env('cosmosdb_key')}`
        }
    ],
    invalidEndpoint: [
        {
            type: "input",
            fieldName: "End point",
            text: "invalid-endpoint"
        }
    ]
};
