export const dynamodbUIConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "Region",
            validations: {
                disabled: false
            }
        },

        {
            type: "dropdown",
            fieldName: "Authentication",
            validations: {
                defaultValue: "Use IAM Access Keys",
                disabled: false
            }
        },

        {
            type: "input",
            fieldName: "Access key",
            validations: {
                isRequired: false,
                placeholder: "Enter access key",
                defaultValue: "",
                disabled: false
            }
        },

        {
            type: "encrypted",
            fieldName: "Secret key",
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

export const dynamodbFormConfig = {
    valid: [
        {
            type: "dropdown",
            fieldName: "Region",
            text: "US West (N. California)"
        },
        {
            type: "input",
            fieldName: "Access key",
            text: `${Cypress.env('dynamodb_access_key')}`
        },
        {
            type: "encrypted",
            fieldName: "Secret key",
            text: `${Cypress.env('dynamodb_secret_key')}`
        }
    ],
    invalidAccessKey: [
        {
            type: "input",
            fieldName: "Access key",
            text: "invalid-access-key"
        }
    ],
    invalidSecretKey: [
        {
            type: "encrypted",
            fieldName: "Secret key",
            text: "invalid-secret-key"
        }
    ]
};
