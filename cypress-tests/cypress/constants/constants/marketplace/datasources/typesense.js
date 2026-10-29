export const typesenseUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "Enter host",
                defaultValue: "localhost",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "Enter port",
                defaultValue: "8108",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "API key",
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
            fieldName: "Protocol",
            validations: {
                defaultValue: "HTTP",
                disabled: false
            }
        }
    ]
};

export const typesenseFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('typesense_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('typesense_port')}`
        },
        {
            type: "encrypted",
            fieldName: "API key",
            text: `${Cypress.env('typesense_api_key')}`
        },
        {
            type: "dropdown",
            fieldName: "Protocol",
            text: "HTTPS"
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
        }
    ],
    invalidApiKey: [
        {
            type: "encrypted",
            fieldName: "API key",
            text: "invalid-api-key"
        }
    ]
};
