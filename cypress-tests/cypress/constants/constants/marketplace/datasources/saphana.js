export const saphanaUIConfig = {
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
            fieldName: "Port",
            validations: {
                isRequired: true,
                placeholder: "Enter port",
                defaultValue: "443",
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
        }
    ]
};

export const saphanaFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('saphana_host') || 'localhost'}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: "443"
        },
        {
            type: "input",
            fieldName: "Database name",
            text: `${Cypress.env('saphana_database') || ''}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('saphana_user') || ''}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('saphana_password') || ''}`
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
    ]
};