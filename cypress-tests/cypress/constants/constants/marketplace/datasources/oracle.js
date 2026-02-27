export const oracleUIConfig = {
    defaultFields: [

        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: true,
                placeholder: "Enter host",
                defaultValue: "localhost",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: true,
                placeholder: "Enter port",
                defaultValue: "1521",
                disabled: false
            }
        },
        {
            type: "dropdown",
            fieldName: "SID / Service name",
            validations: {
                defaultValue: "SID",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database name",
            validations: {
                isRequired: false,
                placeholder: "Name of the database",
                defaultValue: "",
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
            fieldName: "Username",
            validations: {
                isRequired: true,
                placeholder: "Enter username",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "encrypted",
            fieldName: "Password",
            validations: {
                isRequired: true,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true,
                hasEyeIcon: true
            }
        },

        {
            type: "dropdown",
            fieldName: "Client library location",
            validations: {
                defaultValue: "default",
                disabled: false
            }
        },
        {
            type: "dropdown",
            fieldName: "Instant client version",
            validations: {
                defaultValue: "21.10",
                disabled: false
            }
        }
    ]
};

export const oracleFormConfig = {
    valid: [
        {
            type: "dropdown",
            fieldName: "Client library location",
            text: "default"
        },
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('oracle_host') || 'localhost'}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: "1521"
        },
        {
            type: "dropdown",
            fieldName: "SID / Service name",
            text: "SID"
        },
        {
            type: "input",
            fieldName: "Database name",
            text: `${Cypress.env('oracle_database') || ''}`
        },
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: true
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('oracle_user') || ''}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('oracle_password') || ''}`
        },
        {
            type: "dropdown",
            fieldName: "Instant client version",
            text: "21_10"
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
        }
    ],
    invalidPort: [
        {
            type: "input",
            fieldName: "Port",
            text: "9999"
        }
    ],
    invalidDatabase: [
        {
            type: "input",
            fieldName: "Database name",
            text: "invalid-database"
        }
    ],
    invalidUsername: [
        {
            type: "input",
            fieldName: "Username",
            text: "invalid-username"
        }
    ],
    invalidPassword: [
        {
            type: "encrypted",
            fieldName: "Password",
            text: "invalid-password"
        }
    ],
    invalidSsl: [
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: false
        }
    ],
    customClientPath: [
        {
            type: "dropdown",
            fieldName: "Client library location",
            text: "custom"
        },
        {
            type: "input",
            fieldName: "Path",
            text: "/custom/path/to/client"
        }
    ],
    serviceName: [
        {
            type: "dropdown",
            fieldName: "SID / Service name",
            text: "SERVICE_NAME"
        }
    ],
    instantClient11: [
        {
            type: "dropdown",
            fieldName: "Instant client version",
            text: "11_2"
        }
    ]
};