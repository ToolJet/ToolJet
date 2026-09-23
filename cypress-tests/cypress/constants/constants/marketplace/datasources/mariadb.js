const mariadbEnv = Cypress.env("mariadb") || {};

export const mariadbUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "localhost",
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
                placeholder: "3306",
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
            fieldName: "SSL/TLS",
            validations: {
                defaultValue: false,
                disabled: false
            }
        },
        {
            type: "toggle",
            fieldName: "SSH tunnel",
            validations: {
                defaultValue: false,
                disabled: false
            }
        },
        {
            type: "toggle",
            fieldName: "Allow dynamic connection parameters",
            validations: {
                defaultValue: false,
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
            text: `${mariadbEnv.host}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${mariadbEnv.port}`
        },
        {
            type: "input",
            fieldName: "Database",
            text: `${mariadbEnv.database}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${mariadbEnv.userName}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${mariadbEnv.password}`
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
