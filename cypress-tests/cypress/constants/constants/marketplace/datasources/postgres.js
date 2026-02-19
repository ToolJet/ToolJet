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
    valid: [
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
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: false
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
            type: "keyValue",
            fieldName: "Connection options",
            keyValueData: [
                { key: "test", value: "value123" }
            ]
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
    invalidSsl: [
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: true
        }
    ],
};

export const postgresQueryConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "",
            validations: {
                defaultValue: "SQL mode",
                disabled: false,
            },
        },
        {
            type: "codeMirror",
            fieldName: "Query",
            assertion: "contain.text",
            data: "SELECT * FROM users",
        },
        {
            type: "label",
            fieldName: "SQL Parameters",
        },
        {
            type: "keyValue",
            fieldName: null,
            validations: {
                rows: [
                    {
                        key: "Key",
                        keyAssertion: "contain.text",
                        value: "Value",
                        valueAssertion: "contain.text",
                        hasDeleteButton: true,
                    },
                ],
            },
        },
        {
            type: "button",
            fieldName: "Add SQL parameter",
            validations: {
                disabled: false,
            },
        },
    ],
};

export const postgresQueryFillConfig = {
    selectWithParams: [
        {
            type: "codeMirrorInput",
            fieldName: "query",
            text: ["select name from student_data where id=:id"],
        },
        {
            type: "codeMirrorKeyValue",
            fieldName: null,
            addButtonFieldName: "add-sql-parameter",
            keyValueData: [
                { key: "id", value: "2" },
            ],
        },
    ],
};
