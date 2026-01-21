export const mongodbUIConfig = {
    defaultFieldsManual: [
        {
            type: "dropdown",
            fieldName: "Connection type",
            validations: {
                defaultValue: 'Manual connection',
                disabled: false
            }
        },
        {
            type: "dropdown",
            fieldName: "Connection format",
            validations: {
                defaultValue: 'Standard (mongodb)',
                disabled: false
            }
        },

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
            fieldName: "TLS/SSL certificate",
            validations: {
                defaultValue: 'None',
                disabled: false
            }
        },

    ],

    defaultFieldsConnectionString: [
        {
            type: "dropdown",
            fieldName: "Connection type",
            validations: {
                defaultValue: 'Connect using connection string',
                disabled: false
            }
        },
        {
            type: "dropdown",
            fieldName: "Connection format",
            validations: {
                defaultValue: 'Standard (mongodb)',
                disabled: false
            }
        },

        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "prod-db-1.company.com",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "27017",
                defaultValue: "",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Database name",
            validations: {
                isRequired: false,
                placeholder: "customer_data",
                defaultValue: "",
                disabled: false
            }
        },

        {
            type: "input",
            fieldName: "Username",
            validations: {
                isRequired: false,
                placeholder: "admin",
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
            type: "checkbox",
            fieldName: "Use SSL/TLS",
            validations: {
                defaultValue: false,
                disabled: false
            }
        },

    ]
};

export const mongodbFormConfig = {
    valid: [
        {
            type: "dropdown",
            fieldName: "Connection type",
            text: "Manual connection"
        },
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('mongodb_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('mongodb_port')}`
        },
        {
            type: "input",
            fieldName: "Database name",
            text: `${Cypress.env('mongodb_database')}`
        },
        {
            type: "input",
            fieldName: "Username",
            text: `${Cypress.env('mongodb_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('mongodb_password')}`
        }
    ],
    validConnectionString: [
        {
            type: "dropdown",
            fieldName: "Connection type",
            text: "Connect using connection string"
        },
        {
            type: "encrypted",
            fieldName: "Connection string",
            text: `${Cypress.env('mongodb_connString')}`
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
    invalidConnectionString: [
        {
            type: "dropdown",
            fieldName: "Connection type",
            text: "Connect using connection string"
        },
        {
            type: "encrypted",
            fieldName: "Connection string",
            text: "mongodb://invalid-host:27017/test"
        }
    ],
};