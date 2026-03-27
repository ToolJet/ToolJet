export const azureBlobStorageUIConfig = {
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

export const azureBlobStorageFormConfig = {
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
