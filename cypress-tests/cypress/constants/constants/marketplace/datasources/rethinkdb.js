export const rethinkdbUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Database",
            validations: {
                isRequired: false,
                placeholder: "database name",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Username",
            validations: {
                isRequired: false,
                placeholder: "",
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
                hasEyeIcon: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "28015",
                defaultValue: "28015",
                disabled: false
            }
        }
    ]
};

export const rethinkdbFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('rethinkdb_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('rethinkdb_port')}`
        },
        {
            type: "input",
            fieldName: "Database",
            text: `${Cypress.env('rethinkdb_database')}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('rethinkdb_username')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('rethinkdb_password')}`
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
    ]
};
