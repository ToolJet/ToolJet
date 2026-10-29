export const mssqlUIConfig = {
    defaultFields: [
        {
            type: "toggle",
            fieldName: "Allow dynamic connection parameters",
            validations: {
                defaultValue: false,
                disabled: false
            }
        },

        {
            type: "dropdown",
            fieldName: "Connection type",
            validations: {
                defaultValue: 'Manual connection',
                disabled: false
            }
        },

        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: true,
                placeholder: "localhost",
                defaultValue: "localhost",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: true,
                placeholder: "1433",
                defaultValue: "1433",
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
            fieldName: "Database",
            validations: {
                isRequired: false,
                placeholder: "Enter name of the database",
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
            fieldName: "Azure encrypt connection",
            validations: {
                defaultValue: false,
                disabled: false
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
            fieldName: "Port",
            text: "1433"
        },
        {
            type: "input",
            fieldName: "Instance",
            text: `${Cypress.env('sqlserver_instance')}`
        },
        {
            type: "input",
            fieldName: "Database",
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
            fieldName: "Azure encrypt connection",
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
            fieldName: "Database",
            text: "nonexistent_database"
        }
    ],
};
