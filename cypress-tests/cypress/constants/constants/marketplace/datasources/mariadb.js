export const mariadbUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "Enter host",
                defaultValue: "",
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
                showEncrypted: true,
                hasEyeIcon: true
            }
        },
        {
            type: "input",
            fieldName: "Connection limit",
            validations: {
                isRequired: false,
                placeholder: "Enter connection limit",
                defaultValue: "10",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "Enter port",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database",
            validations: {
                isRequired: false,
                placeholder: "Enter name of the database",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "toggle",
            fieldName: "SSL",
            validations: {
                defaultValue: false,
                disabled: false
            }
        },
        {
            type: "dropdown",
            fieldName: "SSL certificate",
            validations: {
                disabled: false
            }
        }
    ]
};

export const mariadbFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('mariadb_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('mariadb_port')}`
        },
        {
            type: "input",
            fieldName: "Database",
            text: `${Cypress.env('mariadb_database')}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('mariadb_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('mariadb_password')}`
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
            fieldName: "Database",
            text: "nonexistent_database"
        }
    ]
};
