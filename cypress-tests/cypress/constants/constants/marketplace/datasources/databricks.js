export const databricksUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "host.cloud.databricks.com",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "443",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "HTTP path",
            validations: {
                isRequired: false,
                placeholder: "/sql/2.0/warehouse/id",
                defaultValue: "",
                disabled: false,
            }
        },
        {
            type: "input",
            fieldName: "Default catalog",
            validations: {
                isRequired: false,
                placeholder: "tooljet_metastore",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Default schema",
            validations: {
                isRequired: false,
                placeholder: "default",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Personal access token",
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
    ]
};

export const databricksFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('databricks_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('databricks_port') || '443'}`
        },
        {
            type: "input",
            fieldName: "HTTP path",
            text: `${Cypress.env('databricks_path') || '/sql/2.0/warehouse/id'}`
        },
        {
            type: "input",
            fieldName: "Default catalog",
            text: "tooljet_metastore"
        },
        {
            type: "input",
            fieldName: "Default schema",
            text: "default"
        },
        {
            type: "encrypted",
            fieldName: "Personal access token",
            text: `${Cypress.env('databricks_token') || 'dapi12345678901234567890'}`
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host.databricks.com"
        }
    ],
    invalidToken: [
        {
            type: "encrypted",
            fieldName: "Personal access token",
            text: "invalid-token"
        }
    ],
    invalidPort: [
        {
            type: "input",
            fieldName: "Port",
            text: "9999"
        }
    ]
};