export const amazonsesUIConfig = {
    defaultFields: [
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

export const amazonsesFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Access key",
            text: `${Cypress.env('aws_access')}`
        },
        {
            type: "encrypted",
            fieldName: "Secret key",
            text: `${Cypress.env('aws_secret')}`
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

export const amazonsesApiOptions = [
    { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
    { key: "access_key", value: "", encrypted: false },
    { key: "secret_key", value: null, encrypted: true },
    { key: "region", value: "", encrypted: false }
];
