export const postgresUIConfig = {
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
                defaultValue: "5432",
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
            type: "toggle",
            fieldName: "SSL",
            validations: {
                defaultValue: true,
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


export const postgresFormConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('pg_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: "5432"
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('pg_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('pg_password')}`
        },
        {
            type: "toggle",
            fieldName: "ssl",
            shouldBeChecked: false
        },
        {
            type: "keyValue",
            fieldName: "Connection options",
            keyValueData: [
                { key: "test", value: "value123" }
            ]
        }
    ]
};