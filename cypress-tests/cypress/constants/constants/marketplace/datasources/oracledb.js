export const oracledbUIConfig = {
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
                isRequired: false,
                placeholder: "Enter username",
                defaultValue: "",
                disabled: false
            }
        },

        {
            type: "encrypted",
            fieldName: "Password",
            validations: {
                isRequired: false,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true
            }
        },

        {
            type: "dropdown",
            fieldName: "Client library location",
            validations: {
                defaultValue: "Default",
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

export const oracledbFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('oracledb_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('oracledb_port')}`
        },
        {
            type: "input",
            fieldName: "Database name",
            text: `${Cypress.env('oracledb_database')}`
        },
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: false
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('oracledb_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('oracledb_password')}`
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
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
            text: "nonexistent_database"
        }
    ]
};
