export const mssqlUIConfig = {
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
            fieldName: "Instance",
            validations: {
                isRequired: false,
                placeholder: "Enter the name of the database instance",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: true,
                placeholder: "Enter port",
                defaultValue: "1433",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database name",
            validations: {
                isRequired: true,
                placeholder: "Name of the database",
                defaultValue: "",
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
            type: "toggle",
            fieldName: "Azure (encrypt connection)",
            validations: {
                defaultValue: false,
                disabled: false
            }
        },

        {
            type: "keyValue",
            fieldName: "Connection options",
            validations: {
                hasAddButton: true,
                rows: [
                    {
                        key: "",
                        value: "",
                        keyPlaceholder: "Key",
                        valuePlaceholder: "Value",
                        hasDeleteButton: true
                    }
                ]
            }
        }
    ]
};

export const mssqlFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('sqlserver_host')}`
        },
        {
            type: "input",
            fieldName: "Instance",
            text: `${Cypress.env('sqlserver_instance')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: "1433"
        },
        {
            type: "input",
            fieldName: "Database name",
            text: `${Cypress.env('sqlserver_db')}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('sqlserver_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('sqlserver_password')}`
        },
        {
            type: "toggle",
            fieldName: "Azure (encrypt connection)",
            shouldBeChecked: false
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
    ],
};