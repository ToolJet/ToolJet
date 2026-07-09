export const dynamodbUIConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "Authentication",
            validations: {
                defaultValue: "IAM Access Keys",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Access key ID",
            validations: {
                isRequired: true,
                placeholder: "Enter access key ID",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Secret access key",
            validations: {
                isRequired: true,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: false
            }
        },
        {
            type: "dropdown",
            fieldName: "Region",
            validations: {
                disabled: false
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
            fieldName: "Access key ID",
            text: `${Cypress.env('dynamodb_access_key')}`
        },
        {
            type: "encrypted",
            fieldName: "Secret access key",
            text: `${Cypress.env('dynamodb_secret_key')}`
        }
    ],
    invalidAccessKey: [
        {
            type: "input",
            fieldName: "Access key ID",
            text: "invalid-access-key"
        }
    ],
    invalidSecretKey: [
        {
            type: "encrypted",
            fieldName: "Secret access key",
            text: "invalid-secret-key"
        }
    ]
};
