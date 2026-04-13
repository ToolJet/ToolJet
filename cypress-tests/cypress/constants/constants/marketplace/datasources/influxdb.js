export const influxdbUIConfig = {
    defaultFields: [
        {
            type: "encrypted",
            fieldName: "API token",
            validations: {
                isRequired: false,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: true
            }
        },
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "8086 ",
                defaultValue: "8086",
                disabled: false
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

export const influxdbFormConfig = {
    valid: [
        {
            type: "encrypted",
            fieldName: "API token",
            text: `${Cypress.env('influxdb_token')}`
        },
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('influxdb_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('influxdb_port')}`
        },
        {
            type: "dropdown",
            fieldName: "Protocol",
            text: "HTTP"
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
        }
    ],
    invalidApiToken: [
        {
            type: "encrypted",
            fieldName: "API token",
            text: "invalid-api-token"
        }
    ]
};
