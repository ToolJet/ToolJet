export const minioUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "Enter host",
                defaultValue: "play.min.io",
                disabled: false
            }
        },

        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "Enter port",
                defaultValue: "9000",
                disabled: false
            }
        },

        {
            type: "toggle",
            fieldName: "SSL",
            validations: {
                defaultValue: true,
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

export const minioFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('minio_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('minio_port')}`
        },
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: false
        },
        {
            type: "input",
            fieldName: "Access key",
            text: `${Cypress.env('minio_accesskey')}`
        },
        {
            type: "encrypted",
            fieldName: "Secret key",
            text: `${Cypress.env('minio_secretkey')}`
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
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
    ],
    invalidPort: [
        {
            type: "input",
            fieldName: "Port",
            text: "9999"
        }
    ],
    invalidSsl: [
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: true
        }
    ]
};
