export const couchdbUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "",
                defaultValue: "localhost",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "5984 ",
                defaultValue: "5984",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Username",
            validations: {
                isRequired: false,
                placeholder: "username for couchDB",
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
            fieldName: "Database name",
            validations: {
                isRequired: false,
                placeholder: "database name",
                defaultValue: "",
                disabled: false
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

export const couchdbFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('couchdb_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('couchdb_port')}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('couchdb_username')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('couchdb_password')}`
        },
        {
            type: "input",
            fieldName: "Database name",
            text: `${Cypress.env('couchdb_database')}`
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
    invalidDatabase: [
        {
            type: "input",
            fieldName: "Database name",
            text: "invalid-database"
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