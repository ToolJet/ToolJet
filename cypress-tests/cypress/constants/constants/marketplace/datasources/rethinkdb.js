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
                hasEyeIcon: true
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
        },

    ]
};

export const rethinkdbFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: 'localhost'
        },
        {
            type: "input",
            fieldName: "Port",
            text: "28015"
        },
        {
            type: "input",
            fieldName: "Database",
            text: "test"
        },
        {
            type: "input",
            fieldName: "Username",
            text: "admin"
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: ''
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
    ]
};