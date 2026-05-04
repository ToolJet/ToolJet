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
                isRequired: true,
                placeholder: "Enter host",
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
                showEncrypted: true
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
            fieldName: "SSH tunnel",
            validations: {
                defaultValue: false,
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
            type: "encrypted",
            fieldName: "Connection string",
            validations: {
                isRequired: true,
                placeholder: "**************",
                defaultValue: "",
                disabled: true,
                hasEditButton: true,
                showEncrypted: true
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
            fieldName: "Database",
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
                showEncrypted: true
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
            fieldName: "SSH tunnel",
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
            fieldName: "Database",
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
