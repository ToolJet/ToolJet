export const smtpUIConfig = {
    defaultFields: [
        {
            type: "input",
            fieldName: "Host",
            validations: {
                isRequired: false,
                placeholder: "Enter host",
                defaultValue: "localhost",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "Port",
            validations: {
                isRequired: false,
                placeholder: "Recommended port 465 (Secured)",
                defaultValue: "465",
                disabled: false
            }
        },
        {
            type: "input",
            fieldName: "User",
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
                hasEyeIcon: false
            }
        }
    ]
};

export const smtpFormConfig = {
    valid: [
        {
            type: "input",
            fieldName: "Host",
            text: `${Cypress.env('smtp_host')}`
        },
        {
            type: "input",
            fieldName: "Port",
            text: `${Cypress.env('smtp_port')}`
        },
        {
            type: "input",
            fieldName: "User",
            text: `${Cypress.env('smtp_user')}`
        },
        {
            type: "encrypted",
            fieldName: "Password",
            text: `${Cypress.env('smtp_password')}`
        }
    ],
    invalidHost: [
        {
            type: "input",
            fieldName: "Host",
            text: "invalid-host"
        }
    ],
    invalidUser: [
        {
            type: "input",
            fieldName: "User",
            text: "invalid-user"
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
