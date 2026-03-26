export const athenaUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Database",
            validations: {
                isRequired: false,
                placeholder: "Enter database name",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "S3 output location",
            validations: {
                isRequired: false,
                placeholder: "Enter output location",
                defaultValue: "",
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

export const athenaFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Database",
            text: `${Cypress.env('amazonathena_DbName')}`
        },
        {
            type: "input",
            fieldName: "Access key",
            text: `${Cypress.env('amazonathena_accessKey')}`
        },
        {
            type: "encrypted",
            fieldName: "Secret key",
            text: `${Cypress.env('amazonathena_secretKey')}`
        },
        {
            type: "dropdown",
            fieldName: "Region",
            text: "US East (N. Virginia)"
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
