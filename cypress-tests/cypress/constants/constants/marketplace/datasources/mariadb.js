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
                options: [
                    { value: "ca_certificate", label: "CA certificate" },
                    { value: "self_signed", label: "Self-signed certificate" },
                    { value: "none", label: "None" }
                ],
                defaultValue: "Select..",
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
            fieldName: "Username",
            text: `${Cypress.env('mariadb_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('mariadb_password')}`
        },
        {
            type: "input",
            fieldName: "Connection limit",
            text: "10"
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
            type: "toggle",
            fieldName: "SSL",
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
    invalidSsl: [
        {
            type: "toggle",
            fieldName: "SSL",
            shouldBeChecked: true
        }
    ],
    caCertificate: [
        {
            type: "dropdown",
            fieldName: "SSL certificate",
            text: "ca_certificate"
        },
        {
            type: "textarea",
            fieldName: "CA cert",
            text: "ca-certificate-content"
        }
    ],
    selfSigned: [
        {
            type: "dropdown",
            fieldName: "SSL certificate",
            text: "self_signed"
        },
        {
            type: "textarea",
            fieldName: "Server cert",
            text: "server-certificate-content"
        },
        {
            type: "textarea",
            fieldName: "Client cert",
            text: "client-certificate-content"
        },
        {
            type: "input",
            fieldName: "Client key",
            text: "client-key-content"
        }
    ]
};