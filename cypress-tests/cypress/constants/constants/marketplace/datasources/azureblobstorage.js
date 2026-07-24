export const azureblobstorageUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Connection string",
            validations: {
                isRequired: false,
                placeholder: "Enter connection string",
                defaultValue: "",
                disabled: false
            }
        }
    ]
};

export const azureblobstorageFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Connection string",
            text: `${Cypress.env('azure_blob_storage_connection_string')}`
        }
    ],
    invalidConnectionString: [
        {
            type: "input",
            fieldName: "Connection string",
            text: "invalid-connection-string"
        }
    ]
};
