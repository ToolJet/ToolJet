export const clickhouseUIConfig = {
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
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "8123",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database name",
            validations: {
                isRequired: false,
                placeholder: "database name",
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
            type: "dropdown",
            fieldName: "Protocol",
            validations: {
                isRequired: false,
                placeholder: "Select..",
                defaultValue: "",
                disabled: false
            }
        }
    ]
};

export const clickhouseFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: Cypress.env('clickhouse_host')
        },
        {
            type: "input",
            fieldName: "Port",
            text: Cypress.env('clickhouse_port')
        },
        {
            type: "input",
            fieldName: "Database name",
            text: Cypress.env('clickhouse_database')
        },
        {
            type: "input",
            fieldName: "Username",
            text: Cypress.env('clickhouse_user')
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: Cypress.env('clickhouse_password')
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
    invalidProtocol: [
        {
            type: "dropdown",
            fieldName: "Protocol",
            text: "HTTPS"
        }
    ]
};